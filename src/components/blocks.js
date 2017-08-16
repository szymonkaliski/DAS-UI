import React from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';

import { GRID_SIZE } from '../constants';

const Input = ({ i, name, isHovered }) => {
  return (
    <div
      className={classnames("block__input", { 'block__input--hovered': isHovered })}
      style={{
        top: (i + 1) * GRID_SIZE * -1
      }}
    >
      {name}
    </div>
  );
};

const Output = ({ i, name, isHovered }) => {
  return (
    <div
      className={classnames("block__output", { 'block__output--hovered': isHovered })}
      style={{
        top: (i + 1) * GRID_SIZE
      }}
    >
      {name}
    </div>
  );
};

const Block = ({ block, spec, cursor }) => {
  const blockWidth = 5; // TODO: block width should be measured if it has custom UI? how?
  const isInsideWidth = block.position.x <= cursor.x && cursor.x < block.position.x + blockWidth;
  const isHovered = cursor.y === block.position.y && isInsideWidth;

  return (
    <div
      className={classnames('block__wrapper', { 'block__wrapper--hovered': isHovered })}
      style={{
        top: block.position.y * GRID_SIZE,
        left: block.position.x * GRID_SIZE,
        width: blockWidth * GRID_SIZE
      }}
    >
      {([...spec.inputs])
        .reverse()
        .map((input, i) =>
          <Input i={i} key={input} name={input} isHovered={isInsideWidth && cursor.y === block.position.y - (i + 1)} />
        )}
      {(spec.outputs || [])
        .map((output, i) =>
          <Output
            i={i}
            key={output}
            name={output}
            isHovered={isInsideWidth && cursor.y === block.position.y + (i + 1)}
          />
        )}
      {block.name}
    </div>
  );
};

const Blocks = ({ blockSpecs, blocks, cursor }) => {
  return (
    <div>
      {blocks.map(block => <Block key={block.id} block={block} cursor={cursor} spec={blockSpecs[block.name]} />)}
    </div>
  );
};

const mapStateToProps = state => ({
  blockSpecs: state.get('blockSpecs').toJS(),
  blocks: state.getIn(['graph', 'blocks']).valueSeq().toJS(),
  cursor: state.get('cursor').toJS()
});

export default connect(mapStateToProps)(Blocks);
