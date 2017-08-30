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
  cancelConnectOrFind,
  connectFromInput,
  connectFromInputTypedLetter,
  connectFromOutput,
  connectFromOutputTypedLetter,
  deleteBlock,
  deleteConnectionFromInput,
  deleteConnectionFromOutput,
  editBlockSpec,
  findBlock,
  findBlockTypedLetter,
  moveBlock,
  moveCursor,
  resizeBlock,
  showNewBlockPrompt
} from './actions';

import Blocks from './components/blocks';
import Connections from './components/connections';
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
    console.log({ blocks: graph.blocks, connections: graph.connections });
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
    const { hovered } = this.props;

    if (!hovered) {
      return;
    }

    if (hovered.type === 'input') {
      this.props.connectFromInput(hovered.blockId, hovered.input);
    } else if (hovered.type === 'output') {
      this.props.connectFromOutput(hovered.blockId, hovered.output);
    }
  }

  deleteHovered() {
    const { hovered } = this.props;

    if (!hovered) {
      return;
    }

    if (hovered.type === 'block') {
      this.props.deleteBlock(hovered.blockId);
    } else if (hovered.type === 'input') {
      this.props.deleteConnectionFromInput(hovered.blockId, hovered.input);
    } else if (hovered.type === 'output') {
      this.props.deleteConnectionFromOutput(hovered.blockId, hovered.output);
    }
  }

  editBlockSpec() {
    const { hovered } = this.props;

    if (!hovered) {
      return;
    }

    if (hovered.type === 'block') {
      this.props.editBlockSpec(hovered.blockId);
    }
  }

  onKeydown(e) {
    const { key, target } = e;
    const { isConnectingFromInput, isConnectingFromOutput, isFindingBlock } = this.props;
    const isLetter = key.match(/[a-z]/i);

    if (target.localName !== 'body') {
      return;
    }

    if ((isConnectingFromInput || isConnectingFromOutput || isFindingBlock) && !isLetter) {
      this.props.cancelConnectOrFind();
      return;
    }

    if (isConnectingFromInput) {
      this.props.connectFromInputTypedLetter(key);
      return;
    }

    if (isConnectingFromOutput) {
      this.props.connectFromOutputTypedLetter(key);
      return;
    }

    if (isFindingBlock) {
      this.props.findBlockTypedLetter(key);
      return;
    }

    const keyFns = {
      h: () => this.props.moveCursor(-1, 0),
      j: () => this.props.moveCursor(0, 1),
      k: () => this.props.moveCursor(0, -1),
      l: () => this.props.moveCursor(1, 0),

      H: () => this.props.moveBlock(-1, 0),
      J: () => this.props.moveBlock(0, 1),
      K: () => this.props.moveBlock(0, -1),
      L: () => this.props.moveBlock(1, 0),

      '>': () => this.props.resizeBlock(1, 0),
      '<': () => this.props.resizeBlock(-1, 0),
      '+': () => this.props.resizeBlock(0, 1),
      '=': () => this.props.resizeBlock(0, 1),
      '-': () => this.props.resizeBlock(0, -1),
      _: () => this.props.resizeBlock(0, -1),

      c: () => this.makeConnections(),
      d: () => this.deleteHovered(),
      e: () => this.editBlockSpec(),
      f: () => this.props.findBlock(),
      n: () => this.props.showNewBlockPrompt()
    };

    if (keyFns[key]) {
      keyFns[key]();
    }
  }

  renderOverlays() {
    const { upsertBlockOverlay } = this.props;

    return (
      <div>
        {upsertBlockOverlay && (
          <Overlay>
            <UpsertBlock block={upsertBlockOverlay} />
          </Overlay>
        )}
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
          {shouldRender && <Blocks />}
          {shouldRender && <Connections gridWidthCount={gridWidthCount} gridHeightCount={gridHeightCount} />}
          {newBlockPrompt && <NewBlock x={x} y={y} />}
        </div>

        {this.renderOverlays()}
      </div>
    );
  }
}

const mapStateToProps = state => {
  const hovered = state.getIn(['ui', 'hovered']);
  const isConnecting = !!state.getIn(['ui', 'newConnection']);

  return {
    cursor: state.getIn(['ui', 'cursor']).toJS(),
    hovered: hovered ? hovered.toJS() : null,
    isConnectingFromInput: isConnecting && hovered.get('input'),
    isConnectingFromOutput: isConnecting && hovered.get('output'),
    isFindingBlock: state.getIn(['ui', 'findingBlock']),
    newBlockPrompt: state.getIn(['ui', 'newBlockPrompt']),
    upsertBlockOverlay: state.getIn(['ui', 'upsertBlockOverlay'])
  };
};

const AppMeasured = withContentRect('bounds')(App);

const AppConnected = connect(mapStateToProps, {
  cancelConnectOrFind,
  connectFromInput,
  connectFromInputTypedLetter,
  connectFromOutput,
  connectFromOutputTypedLetter,
  deleteBlock,
  deleteConnectionFromInput,
  deleteConnectionFromOutput,
  editBlockSpec,
  findBlock,
  findBlockTypedLetter,
  moveBlock,
  moveCursor,
  resizeBlock,
  showNewBlockPrompt
})(AppMeasured);

ReactDOM.render(
  <Provider store={store}>
    <AppConnected />
  </Provider>,
  document.getElementById('root')
);
