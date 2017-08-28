import { fromJS } from 'immutable';
import { Subject } from 'rx';
import autobind from 'react-autobind';
import makeDiff from 'immutable-diff';

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

    this.blocks = {};
    this.connections = {};

    this.onStoreChange();
    this.store.subscribe(this.onStoreChange);
  }

  getBlockSpec(blockName) {
    return { ...this.store.getState().getIn(['blockSpecs', blockName]) };
  }

  getGraphStoreState() {
    return this.store.getState().get('graph');
  }

  onStoreChange() {
    const graphState = this.getGraphStoreState();

    if (!graphState.equals(this.prevGraphState)) {
      const diff = makeDiff(this.prevGraphState, graphState);

      console.info('diff', diff);

      const ops = {
        add: diff => {
          const pathType = diff.getIn(['path', 0]);

          if (pathType === 'blocks') {
            this.addBlock({
              id: diff.getIn(['path', 1]),
              blockName: diff.getIn(['value', 'name'])
            });
          } else if (pathType === 'connections') {
            this.addConnection(diff.get('value').toJS());
          }
        },

        remove: diff => {
          const pathType = diff.getIn(['path', 0]);

          if (pathType === 'blocks') {
            this.removeBlock({ id: diff.getIn(['path', 1]) });
          } else if (pathType === 'connections') {
            this.removeConnection({ id: diff.getIn(['path', 1]) });
          }
        },

        replace: diff => {
          if (diff.getIn(['path', 2]) === 'state') {
            const blockId = diff.getIn(['path', 1]);
            this.updateBlockState({ id: blockId, state: graphState.getIn(['blocks', blockId, 'state']) });
          }
        }
      };

      diff.forEach(singleDiff => {
        const op = ops[singleDiff.get('op')];
        const isKeyIgnored = IGNORED_PATH_KEYS.some(key => singleDiff.get('path').contains(key));

        if (isKeyIgnored) {
          console.info('ignornig diff', { diff: diff.toJS() });
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
  }

  addBlock({ id, blockName }) {
    if (this.blocks[id]) {
      console.warn(`tried creating already existing block with: ${id} ${blockName}`);
      return;
    }

    const blockSpec = this.getBlockSpec(blockName);

    const streams = streamsFromSpec(blockSpec);

    this.blocks[id] = blockSpec;
    this.blocks[id].streams = streams;

    if (!this.blocks[id].code) {
      console.warn(`tried to run .code() on non-existing block: ${id} ${blockName}`);
      return;
    }

    this.blocks[id].code({
      ...streams,
      setState: patch => this.store.dispatch(setBlockState(id, patch))
    });
  }

  addConnection({ id, fromId, fromOutput, toId, toInput }) {
    const outputStream = this.blocks[fromId].streams.outputs[fromOutput];
    const inputStream = this.blocks[toId].streams.inputs[toInput];

    this.connections[id] = outputStream.subscribe(inputStream);
  }

  removeBlock({ id }) {
    delete this.blocks[id];
  }

  removeConnection({ id }) {
    this.connections[id].dispose();

    delete this.connections[id];
  }

  updateBlockState({ id, state }) {
    this.blocks[id].streams.state.onNext(state);
  }
}

const createGraph = store => new Graph(store);

export default createGraph;
