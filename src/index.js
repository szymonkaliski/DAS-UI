import React from 'react';
import ReactDOM from 'react-dom';
import { withContentRect } from 'react-measure';
import times from 'lodash.times';

import './index.css';

const GRID_SIZE = 20;

const BoardGrid = ({ width, height }) => {
  const gridWidthCount = Math.floor(width / GRID_SIZE);
  const gridHeightCount = Math.floor(height / GRID_SIZE);
  const gridWidth = gridWidthCount * GRID_SIZE;
  const gridHeight = gridHeightCount * GRID_SIZE;
  const gridMarginWidth = Math.round((width - gridWidth) / 2 + GRID_SIZE / 2);
  const gridMarginHeight = Math.round((height - gridHeight) / 2 + GRID_SIZE / 2);

  return (
    <g transform={`translate(${gridMarginWidth},${gridMarginHeight})`}>
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

const Board = withContentRect('bounds')(({ contentRect, measureRef }) => {
  const { width, height } = contentRect.bounds;

  return (
    <div ref={measureRef} className="board">
      <svg width={width} height={height} className="board__grid">
        {width > 0 && height > 0 && <BoardGrid width={width} height={height} />}
      </svg>
    </div>
  );
});

const App = () =>
  <div className="app">
    <Board />
  </div>;

ReactDOM.render(<App />, document.getElementById('root'));
