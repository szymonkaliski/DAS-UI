import React from 'react';
import classnames from 'classnames';
import get from 'lodash.get';
import { connect } from 'react-redux';

import { GRID_SIZE } from '../constants';
import { setBlockState } from '../actions';
import { executeBlockSrc } from '../utils';

const BORDER = 1;
const PADDING = 5;

const HighlightFoundLetters = ({ string, typed }) => {
  const regex = new RegExp(`^${typed}`);
  const splited = string.split(regex);

  if (typed.length === 0 || splited.length === 1) {
    return <span>{string}</span>;
  }

  return (
    <span>
      <span className="highlight-letters">{typed}</span>
      {splited[1]}
    </span>
  );
};

const Circle = ({ width = 8, height = 8 }) => (
  <svg className="connector-circle__container" width={width} height={height}>
    <circle className="connector-circle" cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2} />
  </svg>
);

const Input = ({ i, name, width, isHovered, connectingLetter, typedLetters }) => {
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
        <Circle />
        <span className="block__input-name">{name}</span>

        {connectingLetter && (
          <div className="block__input-letter-hover">
            <HighlightFoundLetters string={connectingLetter} typed={typedLetters} />
          </div>
        )}
      </div>
    </div>
  );
};

const Output = ({ i, heightOffset, name, width, isHovered, connectingLetter, typedLetters }) => {
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
        <span className="block__output-name">{name}</span>
        <Circle />

        {connectingLetter && (
          <div className="block__output-letter-hover">
            <HighlightFoundLetters string={connectingLetter} typed={typedLetters} />
          </div>
        )}
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
  typedLetters,
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
        .map((input, i) => (
          <Input
            i={i}
            key={input}
            name={input}
            width={block.size.width}
            isHovered={get(hovered, 'type') === 'input' && get(hovered, 'input') === input}
            typedLetters={typedLetters}
            connectingLetter={get(inputLetterHovers, input)}
          />
        ))}

      {(spec.outputs || [])
        .map((output, i) => (
          <Output
            i={i}
            key={output}
            name={output}
            width={block.size.width}
            heightOffset={block.size.height}
            isHovered={get(hovered, 'type') === 'output' && get(hovered, 'output') === output}
            typedLetters={typedLetters}
            connectingLetter={get(outputLetterHovers, output)}
          />
        ))}

      <div
        className={classnames('block__content', {
          'block__content--hovered': get(hovered, 'type') === 'block'
        })}
        style={{
          width: block.size.width * GRID_SIZE - (BORDER + PADDING) * 2,
          height: block.size.height * GRID_SIZE - (BORDER + PADDING) * 2
        }}
      >
        {isFindingBlock && (
          <div className="block__find">
            <HighlightFoundLetters string={isFindingBlock[block.id]} typed={typedLetters} />
          </div>
        )}
        {block.name}
        {spec.ui && (
          <div>
            {spec.ui({
              state: block.state,
              setState: patch => setBlockState(patch)
            })}
          </div>
        )}
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
  typedLetters,
  isConnectingFromInput,
  isConnectingFromOutput
}) => {
  return (
    <div>
      {blocks.map(block => (
        <Block
          key={block.id}
          block={block}
          cursor={cursor}
          spec={blockSpecs[block.name]}
          hovered={hovered.blockId === block.id && hovered}
          letterHovers={letterHovers}
          isFindingBlock={isFindingBlock}
          typedLetters={typedLetters}
          isConnectingFromInput={isConnectingFromInput}
          isConnectingFromOutput={isConnectingFromOutput}
          setBlockState={patch => setBlockState(block.id, patch)}
        />
      ))}
    </div>
  );
};

const mapStateToProps = state => {
  const hovered = state.getIn(['ui', 'hovered']);
  const isConnecting = !!state.getIn(['ui', 'newConnection']);
  const letterHovers =
    isConnecting &&
    state
      .getIn(['ui', 'newConnection', 'possibleConnections'])
      .valueSeq()
      .toJS();
  const isFindingBlock = state.getIn(['ui', 'findingBlock']);

  const plainBlockSpecs = state.get('blockSpecs').toJS();
  const blockSpecs = Object.keys(plainBlockSpecs).reduce((memo, key) => {
    const spec = plainBlockSpecs[key];
    if (spec.hasUI) {
      spec.ui = executeBlockSrc(spec.src).ui;
    }

    return { ...memo, [key]: spec };
  }, {});

  return {
    blockSpecs,
    blocks: state
      .getIn(['graph', 'blocks'])
      .valueSeq()
      .toJS(),
    cursor: state.getIn(['ui', 'cursor']).toJS(),
    hovered: hovered ? hovered.toJS() : false,
    typedLetters: isFindingBlock
      ? isFindingBlock.get('typed')
      : isConnecting ? state.getIn(['ui', 'newConnection', 'typed']) : '',
    letterHovers,
    isFindingBlock: isFindingBlock
      ? isFindingBlock
          .get('blockLetters')
          .flip()
          .toJS()
      : false,
    isConnectingFromInput: isConnecting && hovered.get('input'),
    isConnectingFromOutput: isConnecting && hovered.get('output')
  };
};

export default connect(mapStateToProps, { setBlockState })(Blocks);
