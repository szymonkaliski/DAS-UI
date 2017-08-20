import React from 'react';
import classnames from 'classnames';
import get from 'lodash.get';
import { connect } from 'react-redux';

import { GRID_SIZE } from '../constants';

const Input = ({ i, name, isHovered, isConnecting, connectingLetter }) => {
  return (
    <div
      className={classnames('block__input', { 'block__input--hovered': isHovered })}
      style={{
        top: (i + 1) * GRID_SIZE * -1
      }}
    >
      {isConnecting ? `[${connectingLetter}] ` : ''}
      {name}
    </div>
  );
};

const Output = ({ i, name, isHovered, isConnecting, connectingLetter }) => {
  return (
    <div
      className={classnames('block__output', { 'block__output--hovered': isHovered })}
      style={{
        top: (i + 1) * GRID_SIZE
      }}
    >
      {isConnecting ? `[${connectingLetter}] ` : ''}
      {name}
    </div>
  );
};

const Block = ({ block, spec, cursor, connectingInputs, connectingOutputs }) => {
  const blockWidth = 5; // TODO: block width should be measured if it has custom UI? how?

  return (
    <div
      className={classnames('block__wrapper', {
        'block__wrapper--hovered': get(block, ['hovered', 'type']) === 'block'
      })}
      style={{
        top: block.position.y * GRID_SIZE,
        left: block.position.x * GRID_SIZE,
        width: blockWidth * GRID_SIZE
      }}
    >
      {spec.inputs
        .slice()
        .reverse()
        .map((input, i) =>
          <Input
            i={i}
            key={input}
            name={input}
            isHovered={get(block, ['hovered', 'type']) === 'input' && get(block, ['hovered', 'name']) === input}
            isConnecting={connectingInputs && block.id !== connectingInputs.blockId}
            connectingLetter={connectingInputs && get(block, ['ui', 'inputLetterHovers', input])}
          />
        )}

      {(spec.outputs || [])
        .map((output, i) =>
          <Output
            i={i}
            key={output}
            name={output}
            isHovered={get(block, ['hovered', 'type']) === 'output' && get(block, ['hovered', 'name']) === output}
            isConnecting={connectingOutputs && block.id !== connectingOutputs.blockId}
            connectingLetter={connectingInputs && get(block, ['ui', 'outputLetterHovers', output])}
          />
        )}
      {block.name}
    </div>
  );
};

const Blocks = ({ blockSpecs, blocks, cursor, connectingInputs, connectingOutputs }) => {
  return (
    <div>
      {blocks.map(block =>
        <Block
          key={block.id}
          block={block}
          cursor={cursor}
          spec={blockSpecs[block.name]}
          connectingInputs={connectingInputs}
          connectingOutputs={connectingOutputs}
        />
      )}
    </div>
  );
};

const mapStateToProps = state => {
  const connectInputs = state.getIn(['ui', 'connectInputs']);
  const connectOutputs = state.getIn(['ui', 'connectOutputs']);

  return {
    blockSpecs: state.get('blockSpecs').toJS(),
    blocks: state.getIn(['graph', 'blocks']).valueSeq().toJS(),
    cursor: state.get('cursor').toJS(),
    connectingInputs: connectInputs ? connectInputs.toJS() : false,
    connectingOutputs: connectOutputs ? connectOutputs.toJS() : false
  };
};

export default connect(mapStateToProps)(Blocks);
