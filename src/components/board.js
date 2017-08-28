import React from 'react';
import times from 'lodash.times';

import { GRID_SIZE } from '../constants';

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

export default Board;
