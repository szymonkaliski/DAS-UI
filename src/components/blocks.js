import React from 'react';
import { connect } from 'react-redux';

import { GRID_SIZE } from '../constants';

const Input = ({ i, name }) => {
  return (
    <div
      className="block__input"
      style={{
        top: (i + 1) * GRID_SIZE * -1
      }}
    >
      {name}
    </div>
  );
};

const Output = ({ i, name }) => {
  return (
    <div
      className="block__output"
      style={{
        top: (i + 1) * GRID_SIZE
      }}
    >
      {name}
    </div>
  );
};

const Block = ({ block, spec }) => {
  console.log({ block, spec });

  return (
    <div
      className="block__wrapper"
      style={{
        top: block.position.x * GRID_SIZE,
        left: block.position.y * GRID_SIZE
      }}
    >
      {(spec.inputs || []).reverse().map((input, i) => <Input i={i} key={input} name={input} />)}
      {(spec.outputs || []).map((output, i) => <Output i={i} key={output} name={output} />)}
      {block.name}
    </div>
  );
};

const Blocks = ({ blockSpecs, blocks }) => {
  return (
    <div>
      {blocks.map(block => <Block key={block.id} block={block} spec={blockSpecs[block.name]} />)}
    </div>
  );
};

const mapStateToProps = state => ({
  blockSpecs: state.get('blockSpecs').toJS(),
  blocks: state.getIn(['graph', 'blocks']).valueSeq().toJS()
});

export default connect(mapStateToProps)(Blocks);
