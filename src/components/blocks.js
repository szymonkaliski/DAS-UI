import React from 'react';
import classnames from 'classnames';
import get from 'lodash.get';
import { connect } from 'react-redux';

import { GRID_SIZE } from '../constants';

const Input = ({ i, name, isHovered, connectingLetter }) => {
  return (
    <div
      className={classnames('block__input', { 'block__input--hovered': isHovered })}
      style={{
        top: (i + 1) * GRID_SIZE * -1
      }}
    >
      {connectingLetter ? `[${connectingLetter}] ` : ''}
      {name}
    </div>
  );
};

const Output = ({ i, name, isHovered, connectingLetter }) => {
  return (
    <div
      className={classnames('block__output', { 'block__output--hovered': isHovered })}
      style={{
        top: (i + 1) * GRID_SIZE
      }}
    >
      {connectingLetter ? `[${connectingLetter}] ` : ''}
      {name}
    </div>
  );
};

const Block = ({ block, spec, cursor, hovered, letterHovers, isConnectingFromInput, isConnectingFromOutput }) => {
  const blockWidth = 5; // TODO: block width should be measured if it has custom UI? how?

  const outputLetterHovers =
    isConnectingFromInput &&
    letterHovers
      .filter(({ blockId }) => blockId === block.id)
      .reduce((memo, { code, connector }) => ({ ...memo, [connector]: code }), {});

  const inputLetterHovers =
    isConnectingFromOutput &&
    letterHovers
      .filter(({ blockId }) => blockId === block.id)
      .reduce((memo, { code, connector }) => ({ ...memo, [connector]: code }), {});

  return (
    <div
      className={classnames('block__wrapper', {
        'block__wrapper--hovered': get(hovered, 'type') === 'block'
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
            isHovered={get(hovered, 'type') === 'input' && get(hovered, 'input') === input}
            connectingLetter={get(inputLetterHovers, input)}
          />
        )}

      {(spec.outputs || [])
        .map((output, i) =>
          <Output
            i={i}
            key={output}
            name={output}
            isHovered={get(hovered, 'type') === 'output' && get(hovered, 'output') === output}
            connectingLetter={get(outputLetterHovers, output)}
          />
        )}
      {block.name}
    </div>
  );
};

const Blocks = ({
  blockSpecs,
  blocks,
  cursor,
  hovered,
  letterHovers,
  isConnectingFromInput,
  isConnectingFromOutput
}) => {
  return (
    <div>
      {blocks.map(block =>
        <Block
          key={block.id}
          block={block}
          cursor={cursor}
          spec={blockSpecs[block.name]}
          hovered={hovered.blockId === block.id && hovered}
          letterHovers={letterHovers}
          isConnectingFromInput={isConnectingFromInput}
          isConnectingFromOutput={isConnectingFromOutput}
        />
      )}
    </div>
  );
};

const mapStateToProps = state => {
  const hovered = state.getIn(['ui', 'hovered']);
  const isConnecting = !!state.getIn(['ui', 'newConnection']);
  const letterHovers = isConnecting && state.getIn(['ui', 'newConnection', 'possibleConnections']).valueSeq().toJS();

  return {
    blockSpecs: state.get('blockSpecs').toJS(),
    blocks: state.getIn(['graph', 'blocks']).valueSeq().toJS(),
    cursor: state.get('cursor').toJS(),

    hovered: hovered ? hovered.toJS() : false,
    letterHovers,
    isConnectingFromInput: isConnecting && hovered.get('input'),
    isConnectingFromOutput: isConnecting && hovered.get('output')
  };
};

export default connect(mapStateToProps)(Blocks);
