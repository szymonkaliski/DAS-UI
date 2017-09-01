import React from 'react';
import times from 'lodash.times';
import { connect } from 'react-redux';

import { GRID_SIZE } from '../constants';

const BoardGrid = ({ grid }) => {
  return (
    <g>
      {times(grid.width).map(i => {
        return times(grid.height).map(j => {
          const x = i * GRID_SIZE;
          const y = j * GRID_SIZE;
          return <circle cx={x} cy={y} r={1} className="board__grid-point" />;
        });
      })}
    </g>
  );
};

const BoardCursor = ({ position, grid }) => {
  return (
    <rect
      className="board__cursor"
      x={(position.x - grid.offsetX) * GRID_SIZE}
      y={(position.y - grid.offsetY) * GRID_SIZE}
      width={GRID_SIZE}
      height={GRID_SIZE}
    />
  );
};

const Board = ({ cursor, grid }) => {
  return (
    <svg width={grid.width * GRID_SIZE} height={grid.height * GRID_SIZE} className="board">
      <BoardGrid grid={grid} />
      <BoardCursor position={cursor} grid={grid} />
    </svg>
  );
};

const mapStateToProps = state => ({
  cursor: state.getIn(['ui', 'cursor']).toJS(),
  grid: state.getIn(['ui', 'grid']).toJS()
});

export default connect(mapStateToProps)(Board);
