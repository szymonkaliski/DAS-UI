import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import autobind from 'react-autobind';
import times from 'lodash.times';
import { connect, Provider } from 'react-redux';
import { createStore } from 'redux';
import { withContentRect } from 'react-measure';

import { moveCursor, makeNewBlock } from './actions';
import reducer from './reducers';
import { GRID_SIZE } from './constants';

import './index.css';

const store = createStore(reducer);

class NewBlockUI extends Component {
  componentDidMount() {
    // focus with short timeout so we don't populate the field with just clicked letter
    setTimeout(() => this.inputRef.focus(), 1);
  }

  render() {
    const { x, y } = this.props;

    return (
      <div className="new_block" style={{ top: x, left: y }}>
        <input ref={ref => (this.inputRef = ref)} />
      </div>
    );
  }
}

const BoardGrid = ({ gridWidthCount, gridHeightCount }) => {
  return (
    <g>
      {times(gridWidthCount).map(i => {
        return times(gridHeightCount).map(j => {
          const x = i * GRID_SIZE;
          const y = j * GRID_SIZE;
          return <circle cx={x} cy={y} r={1} className="board__grid-point" />;
        });
      })}
    </g>
  );
};

const BoardCursor = ({ position }) => {
  return (
    <rect
      className="board__cursor"
      x={position.x * GRID_SIZE}
      y={position.y * GRID_SIZE}
      rx={6}
      ry={6}
      width={GRID_SIZE}
      height={GRID_SIZE}
    />
  );
};

const Board = ({ cursor, gridWidthCount, gridHeightCount }) => {
  return (
    <svg width={gridWidthCount * GRID_SIZE} height={gridHeightCount * GRID_SIZE} className="board">
      <BoardGrid gridWidthCount={gridWidthCount} gridHeightCount={gridHeightCount} />
      <BoardCursor position={cursor} />
    </svg>
  );
};

class App extends Component {
  constructor() {
    super();
    autobind(this);

    this.state = {
      newBlockUI: false
    };
  }

  componentDidMount() {
    document.addEventListener('keydown', this.onKeydown);
  }

  componentWillUmount() {
    document.removeEventListener('keydown', this.onKeydown);
  }

  onKeydown({ key }) {
    const keyFns = {
      ArrowDown: () => this.props.moveCursor(0, 1),
      ArrowUp: () => this.props.moveCursor(0, -1),
      ArrowLeft: () => this.props.moveCursor(-1, 0),
      ArrowRight: () => this.props.moveCursor(1, 0),
      n: () => {
        this.setState({ newBlockUI: true });
        // this.props.makeNewBlock()
      }
    };

    if (keyFns[key]) {
      keyFns[key]();
    }
  }

  render() {
    const { newBlockUI } = this.state;
    const { contentRect, measureRef } = this.props;
    const { width, height } = contentRect.bounds;

    const gridWidthCount = Math.floor(width / GRID_SIZE) - 1;
    const gridHeightCount = Math.floor(height / GRID_SIZE) - 1;
    const gridWidth = gridWidthCount * GRID_SIZE;
    const gridHeight = gridHeightCount * GRID_SIZE;
    const gridMarginWidth = Math.floor((width - gridWidth) / 2 + GRID_SIZE / 2);
    const gridMarginHeight = Math.floor((height - gridHeight) / 2 + GRID_SIZE / 2);

    const shouldRender = width > 0 && height > 0;

    return (
      <div className="app" ref={measureRef}>
        <div style={{ paddingLeft: gridMarginWidth, paddingTop: gridMarginHeight }}>
          {shouldRender &&
            <Board gridWidthCount={gridWidthCount} gridHeightCount={gridHeightCount} cursor={this.props.cursor} />}
          {newBlockUI &&
            <NewBlockUI
              x={this.props.cursor.y * GRID_SIZE + gridMarginHeight}
              y={this.props.cursor.x * GRID_SIZE + gridMarginWidth}
            />}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({ cursor: state.get('cursor').toJS() });

const AppMeasured = withContentRect('bounds')(App);
const AppConnected = connect(mapStateToProps, { moveCursor, makeNewBlock })(AppMeasured);

ReactDOM.render(
  <Provider store={store}>
    <AppConnected />
  </Provider>,
  document.getElementById('root')
);
