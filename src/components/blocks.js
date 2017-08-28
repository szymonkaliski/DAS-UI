import React from 'react';
import classnames from 'classnames';
import get from 'lodash.get';
import { connect } from 'react-redux';

import { GRID_SIZE } from '../constants';
import { setBlockState } from '../actions';

const BORDER = 2;
const PADDING = 4;

const Input = ({ i, name, width, isHovered, connectingLetter }) => {
  return (
    <div
      className={classnames('block__input', { 'block__input--hovered': isHovered })}
      style={{
        top: (i + 1) * GRID_SIZE * -1,
        width: width * GRID_SIZE - BORDER * 2,
        height: GRID_SIZE - BORDER * 2
      }}
    >
      <div className="block__input-content">
        {connectingLetter ? `[${connectingLetter}] ` : ''}
        {name}
      </div>
    </div>
  );
};

const Output = ({ i, heightOffset, name, width, isHovered, connectingLetter }) => {
  return (
    <div
      className={classnames('block__output', { 'block__output--hovered': isHovered })}
      style={{
        top: (i + heightOffset) * GRID_SIZE,
        width: width * GRID_SIZE - BORDER * 2,
        height: GRID_SIZE - BORDER * 2
      }}
    >
      <div className="block__output-content">
        {connectingLetter ? `[${connectingLetter}] ` : ''}
        {name}
      </div>
    </div>
  );
};

const Block = ({
  block,
  spec,
  cursor,
  hovered,
  letterHovers,
  setBlockState,
  isFindingBlock,
  isConnectingFromInput,
  isConnectingFromOutput
}) => {
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
      className="block__wrapper"
      style={{
        top: block.position.y * GRID_SIZE,
        left: block.position.x * GRID_SIZE
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
            width={block.size.width}
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
            width={block.size.width}
            heightOffset={block.size.height}
            isHovered={get(hovered, 'type') === 'output' && get(hovered, 'output') === output}
            connectingLetter={get(outputLetterHovers, output)}
          />
        )}

      <div
        className={classnames('block__content', {
          'block__content--hovered': get(hovered, 'type') === 'block'
        })}
        style={{
          width: block.size.width * GRID_SIZE - (BORDER + PADDING) * 2,
          height: block.size.height * GRID_SIZE - (BORDER + PADDING) * 2
        }}
      >
        {isFindingBlock ? `${isFindingBlock[block.id]} : ` : ''}
        {block.name}
        {spec.ui &&
          <div>
            {spec.ui({
              ...block.state,
              setState: patch => setBlockState(patch)
            })}
          </div>}
      </div>
    </div>
  );
};

const Blocks = ({
  blockSpecs,
  blocks,
  cursor,
  hovered,
  letterHovers,
  setBlockState,
  isFindingBlock,
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
          isFindingBlock={isFindingBlock}
          isConnectingFromInput={isConnectingFromInput}
          isConnectingFromOutput={isConnectingFromOutput}
          setBlockState={patch => setBlockState(block.id, patch)}
        />
      )}
    </div>
  );
};

const mapStateToProps = state => {
  const hovered = state.getIn(['ui', 'hovered']);
  const isConnecting = !!state.getIn(['ui', 'newConnection']);
  const letterHovers = isConnecting && state.getIn(['ui', 'newConnection', 'possibleConnections']).valueSeq().toJS();
  const isFindingBlock = state.getIn(['ui', 'findingBlock']);

  return {
    blockSpecs: state.get('blockSpecs').toJS(),
    blocks: state.getIn(['graph', 'blocks']).valueSeq().toJS(),
    cursor: state.getIn(['ui', 'cursor']).toJS(),
    hovered: hovered ? hovered.toJS() : false,
    letterHovers,
    isFindingBlock: isFindingBlock ? isFindingBlock.get('blockLetters').flip().toJS() : false,
    isConnectingFromInput: isConnecting && hovered.get('input'),
    isConnectingFromOutput: isConnecting && hovered.get('output')
  };
};

export default connect(mapStateToProps, { setBlockState })(Blocks);
