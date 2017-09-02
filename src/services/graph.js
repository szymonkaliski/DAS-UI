import autobind from 'react-autobind';
import makeDiff from 'immutable-diff';
import { Subject } from 'rx';
import { fromJS } from 'immutable';

import { executeBlockSrc } from '../utils';
import { setBlockState } from '../actions';

const streamsFromSpec = ({ inputs = [], outputs = [] }) => {
  const makeStreams = xs => xs.reduce((memo, key) => Object.assign(memo, { [key]: new Subject() }), {});

  return {
    inputs: makeStreams(inputs),
    outputs: makeStreams(outputs),
    state: new Subject()
  };
};

const IGNORED_PATH_KEYS = ['position', 'size'];

class Graph {
  constructor(store) {
    autobind(this);

    this.store = store;
    this.prevGraphState = fromJS({ blocks: {}, connections: {} });
    this.prevBlockSpecState = this.getBlockSpecState();

    this.blocks = {};
    this.connections = {};

    this.onStoreChange();
    this.store.subscribe(this.onStoreChange);
  }

  getBlockSpec(blockName) {
    return executeBlockSrc(this.getBlockSpecState().getIn([blockName, 'src']));
  }

  getGraphStoreState() {
    return this.store.getState().get('graph');
  }

  getBlockSpecState() {
    return this.store.getState().get('blockSpecs');
  }

  onStoreChange() {
    const graphState = this.getGraphStoreState();
    const blockSpecState = this.getBlockSpecState();

    // first gather operations, and then execute them one by one
    // fixes bugs where we are trying to run graph that is part old, part new...
    let futureOps = [];

    if (!graphState.equals(this.prevGraphState)) {
      const diff = makeDiff(this.prevGraphState, graphState);

      const ops = {
        add: diff => {
          const pathType = diff.getIn(['path', 0]);

          if (pathType === 'blocks') {
            futureOps.push([
              this.addBlock,
              {
                id: diff.getIn(['path', 1]),
                blockName: diff.getIn(['value', 'name'])
              }
            ]);
          } else if (pathType === 'connections') {
            futureOps.push([this.addConnection, diff.get('value').toJS()]);
          }
        },

        remove: diff => {
          const pathType = diff.getIn(['path', 0]);

          if (pathType === 'blocks') {
            futureOps.push([this.removeBlock, { id: diff.getIn(['path', 1]) }]);
          } else if (pathType === 'connections') {
            futureOps.push([this.removeConnection, { id: diff.getIn(['path', 1]) }]);
          }
        }
      };

      diff.forEach(singleDiff => {
        const op = ops[singleDiff.get('op')];
        const isKeyIgnored = IGNORED_PATH_KEYS.some(key => singleDiff.get('path').contains(key));
        const isStateChanged = singleDiff.getIn(['path', 2]) === 'state';

        if (isKeyIgnored) {
          return;
        }

        if (isStateChanged) {
          const blockId = singleDiff.getIn(['path', 1]);

          futureOps.push([
            this.updateBlockState,
            {
              id: blockId,
              state: graphState.getIn(['blocks', blockId, 'state']).toJS()
            }
          ]);

          return;
        }

        if (!op) {
          console.warn(`unknown op: ${singleDiff.get('op')}`, { diff: diff.toJS() });
          return;
        }

        op(singleDiff);
      });

      this.prevGraphState = graphState;
    }

    if (!blockSpecState.equals(this.prevBlockSpecState)) {
      const diff = makeDiff(this.prevBlockSpecState, blockSpecState);

      diff.forEach(singleDiff => {
        const blockSpecName = singleDiff.getIn(['path', 0]);

        const blocks = graphState.get('blocks').filter(block => block.get('name') === blockSpecName);

        const blocksIds = blocks.map(block => block.get('id'));
        const blocksConnections = graphState
          .get('connections')
          .filter(connection => blocksIds.some(id => connection.get('fromId') === id || connection.get('toId') === id));

        // destory and rebuild blocks and connections to refresh the graph with new code...

        blocksConnections.forEach(connection => {
          futureOps.push([this.removeConnection, { id: connection.get('id') }]);
        });

        blocks.forEach(block => {
          futureOps.push([this.removeBlock, { id: block.get('id') }]);
        });

        blocks.forEach(block => {
          futureOps.push([
            this.addBlock,
            {
              id: block.get('id'),
              blockName: block.get('name')
            }
          ]);
        });

        blocksConnections.forEach(connection => {
          futureOps.push([this.addConnection, connection.toJS()]);
        });
      });

      this.prevBlockSpecState = blockSpecState;
    }

    futureOps.forEach(([op, args]) => op(args));
  }

  addBlock({ id, blockName }) {
    if (this.blocks[id]) {
      console.warn(`tried creating already existing block id: ${id} (${blockName})`);
      return;
    }

    const blockSpec = this.getBlockSpec(blockName);

    const streams = streamsFromSpec(blockSpec);

    this.blocks[id] = blockSpec;
    this.blocks[id].streams = streams;

    this.blocks[id].code({
      ...streams,
      setState: patch => this.store.dispatch(setBlockState(id, patch))
    });

    // update block state after everything is done,
    // used for initialising from DB/localStorage
    setTimeout(() => {
      const blockState = this.getGraphStoreState()
        .getIn(['blocks', id, 'state'])
        .toJS();

      this.updateBlockState({ id, state: blockState });
    }, 0);
  }

  addConnection({ id, fromId, fromOutput, toId, toInput }) {
    if (this.connections[id]) {
      console.warn(`tried creating already existing connection id: ${id}`);
      return;
    }

    const outputStream = this.blocks[fromId].streams.outputs[fromOutput];
    const inputStream = this.blocks[toId].streams.inputs[toInput];

    this.connections[id] = outputStream.subscribe(inputStream);
  }

  removeBlock({ id }) {
    if (!this.blocks[id]) {
      console.warn(`tried removing non-existing block id: ${id}`);
      return;
    }

    if (this.blocks[id].cleanup) {
      this.blocks[id].cleanup();
    }

    delete this.blocks[id];
  }

  removeConnection({ id }) {
    if (!this.connections[id]) {
      console.warn(`tried removing non-existing connection id: ${id}`);
      return;
    }

    this.connections[id].dispose();

    delete this.connections[id];
  }

  updateBlockState({ id, state }) {
    this.blocks[id].streams.state.onNext(state);
  }
}

const createGraph = store => new Graph(store);

export default createGraph;
