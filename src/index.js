import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import autobind from 'react-autobind';
import times from 'lodash.times';
import { connect, Provider } from 'react-redux';
import { createStore } from 'redux';
import { withContentRect } from 'react-measure';

import { moveCursor } from './actions';
import reducer from './reducers';
import { GRID_SIZE } from './constants';

import './index.css';

const store = createStore(reducer);

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

const Board = withContentRect('bounds')(({ contentRect, measureRef, cursor }) => {
  const { width, height } = contentRect.bounds;

  const gridWidthCount = Math.floor(width / GRID_SIZE);
  const gridHeightCount = Math.floor(height / GRID_SIZE);
  const gridWidth = gridWidthCount * GRID_SIZE;
  const gridHeight = gridHeightCount * GRID_SIZE;
  const gridMarginWidth = Math.round((width - gridWidth) / 2 + GRID_SIZE / 2);
  const gridMarginHeight = Math.round((height - gridHeight) / 2 + GRID_SIZE / 2);

  const shouldRender = width > 0 && height > 0;

  return (
    <div ref={measureRef} className="board">
      <svg width={width} height={height} className="board__grid">
        {shouldRender &&
          <g transform={`translate(${gridMarginWidth},${gridMarginHeight})`}>
            <BoardGrid gridWidthCount={gridWidthCount} gridHeightCount={gridHeightCount} />
            <BoardCursor position={cursor} />
          </g>}
      </svg>
    </div>
  );
});

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

  onKeydown({ key }) {
    console.log({ key });

    const keyFns = {
      ArrowDown: () => this.props.moveCursor(0, 1),
      ArrowUp: () => this.props.moveCursor(0, -1),
      ArrowLeft: () => this.props.moveCursor(-1, 0),
      ArrowRight: () => this.props.moveCursor(1, 0),
      c: () => {
        console.log('create a block!');
      }
    };

    if (keyFns[key]) {
      keyFns[key]();
    }
  }

  render() {
    return (
      <div className="app">
        <Board cursor={this.props.cursor} />
      </div>
    );
  }
}

const mapStateToProps = state => ({ cursor: state.get('cursor').toJS() });

const AppConnected = connect(mapStateToProps, { moveCursor })(App);

ReactDOM.render(
  <Provider store={store}>
    <AppConnected />
  </Provider>,
  document.getElementById('root')
);
