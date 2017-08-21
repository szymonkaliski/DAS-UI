import DOM from 'react-dom-factories';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import autobind from 'react-autobind';
import { connect, Provider } from 'react-redux';
import { createStore } from 'redux';
import { withContentRect } from 'react-measure';

import createGraph from './services/graph';
import reducer from './reducers';
import { IS_DEBUG, GRID_SIZE } from './constants';

import {
  moveCursor,
  showNewBlockPrompt,
  connectOutputs,
  connectInputs,
  connectOutputLetter,
  connectInputLetter
} from './actions';

import Blocks from './components/blocks';
import Board from './components/board';
import UpsertBlock from './components/upsert-block';
import NewBlock from './components/new-block';
import Overlay from './components/overlay';

import './index.css';

// for blocks ad-hoc UIs
window.DOM = DOM;

const store = createStore(reducer);
const graph = createGraph(store);

if (IS_DEBUG) {
  window.dumpState = () => {
    console.log(store.getState().toJS());
  };

  window.dumpGraph = () => {
    console.log({
      blocks: graph.blocks,
      connections: graph.connections
    });
  };
}

class App extends Component {
  constructor() {
    super();
    autobind(this);
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeydown);
  }

  componentWillUmount() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  makeConnections() {
    const { hoveredBlock } = this.props;

    if (!hoveredBlock) {
      return;
    }

    if (hoveredBlock.type === 'input') {
      this.props.connectOutputs(hoveredBlock.id, hoveredBlock.name);
    } else if (hoveredBlock.type === 'output') {
      this.props.connectInputs(hoveredBlock.id, hoveredBlock.name);
    }
  }

  onKeydown(e) {
    const { key, target } = e;
    const { connectingInputs, connectingOutputs } = this.props;

    if (target.localName !== 'body') {
      return;
    }

    // TODO: if not-letter then cancel
    if (connectingInputs) {
      this.props.connectInputLetter(key);
      return;
    }

    // TODO: if not-letter then cancel
    if (connectingOutputs) {
      this.props.connectOutputLetter(key);
      return;
    }

    const keyFns = {
      h: () => this.props.moveCursor(-1, 0),
      j: () => this.props.moveCursor(0, 1),
      k: () => this.props.moveCursor(0, -1),
      l: () => this.props.moveCursor(1, 0),
      n: () => this.props.showNewBlockPrompt(),
      c: () => this.makeConnections()
    };

    if (keyFns[key]) {
      keyFns[key]();
    }
  }

  renderOverlays() {
    const { upsertBlockOverlay } = this.props;

    return (
      <div>
        {upsertBlockOverlay &&
          <Overlay>
            <UpsertBlock block={upsertBlockOverlay} />
          </Overlay>}
      </div>
    );
  }

  render() {
    const { cursor, contentRect, measureRef, newBlockPrompt } = this.props;
    const { width, height } = contentRect.bounds;

    const gridWidthCount = Math.floor(width / GRID_SIZE) - 1;
    const gridHeightCount = Math.floor(height / GRID_SIZE) - 1;
    const gridWidth = gridWidthCount * GRID_SIZE;
    const gridHeight = gridHeightCount * GRID_SIZE;
    const gridMarginWidth = Math.floor((width - gridWidth) / 2 + GRID_SIZE / 2);
    const gridMarginHeight = Math.floor((height - gridHeight) / 2 + GRID_SIZE / 2);

    const shouldRender = width > 0 && height > 0;

    const x = cursor.x * GRID_SIZE;
    const y = cursor.y * GRID_SIZE;

    return (
      <div className="app" ref={measureRef}>
        <div style={{ transform: `translate(${gridMarginWidth}px, ${gridMarginHeight}px)` }}>
          {shouldRender && <Board gridWidthCount={gridWidthCount} gridHeightCount={gridHeightCount} cursor={cursor} />}
          {newBlockPrompt && <NewBlock x={x} y={y} />}
          <Blocks />
        </div>

        {this.renderOverlays()}
      </div>
    );
  }
}

const mapStateToProps = state => {
  const hoveredBlock = state.getIn(['graph', 'blocks']).find(block => block.get('hovered') !== false);

  const connectInputs = state.getIn(['ui', 'connectInputs']);
  const connectOutputs = state.getIn(['ui', 'connectOutputs']);

  return {
    cursor: state.get('cursor').toJS(),
    upsertBlockOverlay: state.getIn(['ui', 'upsertBlockOverlay']),
    newBlockPrompt: state.getIn(['ui', 'newBlockPrompt']),
    hoveredBlock: hoveredBlock ? { ...hoveredBlock.get('hovered').toJS(), id: hoveredBlock.get('id') } : null,
    connectingInputs: connectInputs ? connectInputs.toJS() : false,
    connectingOutputs: connectOutputs ? connectOutputs.toJS() : false
  };
};

const AppMeasured = withContentRect('bounds')(App);

const AppConnected = connect(mapStateToProps, {
  moveCursor,
  showNewBlockPrompt,
  connectInputs,
  connectOutputs,
  connectInputLetter,
  connectOutputLetter
})(AppMeasured);

ReactDOM.render(
  <Provider store={store}>
    <AppConnected />
  </Provider>,
  document.getElementById('root')
);
