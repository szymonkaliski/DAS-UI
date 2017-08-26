import { fromJS } from 'immutable';
import { Subject } from 'rx';
import autobind from 'react-autobind';
import makeDiff from 'immutable-diff';

const streamsFromSpec = ({ inputs = [], outputs = [] }) => {
  const makeStreams = xs => xs.reduce((memo, key) => Object.assign(memo, { [key]: new Subject() }), {});

  return {
    inputs: makeStreams(inputs),
    outputs: makeStreams(outputs)
  };
};

const IGNORED_PATH_KEYS = ['position'];

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

      console.log('graphState changed', graphState, diff);

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
    const blockSpec = this.getBlockSpec(blockName);

    const streams = streamsFromSpec(blockSpec);

    this.blocks[id] = blockSpec;
    this.blocks[id]._streams = streams;
    this.blocks[id].code({ ...streams });
  }

  addConnection({ id, fromId, fromOutput, toId, toInput }) {
    const outputStream = this.blocks[fromId]._streams.outputs[fromOutput];
    const inputStream = this.blocks[toId]._streams.inputs[toInput];

    this.connections[id] = outputStream.subscribe(inputStream);
  }

  removeBlock({ id }) {
    delete this.blocks[id];
  }

  removeConnection({ id }) {
    this.connections[id].dispose();

    delete this.connections[id];
  }
}

const createGraph = store => new Graph(store);

export default createGraph;
