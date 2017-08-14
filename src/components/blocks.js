import React from 'react';
import { connect } from 'react-redux';

import { GRID_SIZE } from '../constants';

const Block = ({ block }) => {
  console.log(block);

  return (
    <div
      className="block__wrapper"
      style={{
        top: block.position.x * GRID_SIZE,
        left: block.position.y * GRID_SIZE
      }}
    >
      {block.name}
    </div>
  );
};

const Blocks = ({ blocks }) => {
  return (
    <div>
      {blocks.map(block => <Block key={block.id} block={block} />)}
    </div>
  );
};

const mapStateToProps = state => ({
  blocks: state.getIn(['graph', 'blocks']).valueSeq().toJS()
});

export default connect(mapStateToProps)(Blocks);
