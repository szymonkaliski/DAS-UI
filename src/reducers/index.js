import { fromJS } from 'immutable';
import uuid from 'uuid/v4';
import times from 'lodash.times';
import leftPad from 'left-pad';

import {
  IS_DEBUG,
  MOVE_CURSOR,
  CREATE_BLOCK,
  UPSERT_BLOCK,
  NEW_BLOCK_NAME,
  SHOW_NEW_BLOCK_PROMPT,
  CLOSE_NEW_BLOCK_PROMPT,
  CONNECT_FROM_INPUT,
  CONNECT_FROM_OUTPUT,
  CONNECT_FROM_INPUT_TYPED_LETTER,
  CONNECT_FROM_OUTPUT_TYPED_LETTER
} from '../constants';

import { executeBlockSrc } from '../utils';

const stringifyState = obj => {
  return JSON.stringify(obj, (_, value) => (typeof value === 'function' ? value.toString() : value));
};

const parseState = str => {
  let parsed;

  try {
    parsed = JSON.parse(str);
  } catch (e) {
    console.error(e);
  }

  if (!parsed) {
    return;
  }

  Object.keys(parsed.blockSpecs || {}).forEach(key => {
    const parsedBlockSpec = parsed.blockSpecs[key];

    if (parsedBlockSpec.code) {
      parsedBlockSpec.code = executeBlockSrc(parsedBlockSpec.code);
    }

    if (parsedBlockSpec.ui) {
      parsedBlockSpec.ui = executeBlockSrc(parsedBlockSpec.ui);
    }
  });

  return parsed;
};

let initialState = fromJS({
  cursor: {
    x: 0,
    y: 0
  },
  blockSpecs: {},
  graph: {
    blocks: {},
    connections: {}
  },
  ui: {
    hovered: false,
    upsertBlockOverlay: false,
    newBlockPrompt: false,
    newConnection: false
  }
});

if (IS_DEBUG) {
  const parsed = parseState(localStorage.getItem('state'));

  window.clearState = () => {
    localStorage.setItem('state', null);
    window.location.reload();
  };

  if (parsed) {
    initialState = fromJS(parsed);

    // block specs are plain JS objects inside of state!
    initialState = initialState.delete('blockSpecs');
    Object.keys(parsed.blockSpecs).forEach(key => {
      initialState = initialState.setIn(['blockSpecs', key], parsed.blockSpecs[key]);
    });
  }
}

const createBlockOnBoard = (state, block) => {
  const id = uuid();

  return state.setIn(
    ['graph', 'blocks', id],
    fromJS({
      id,
      name: block,
      position: state.get('cursor').toJS(),
      hovered: { type: 'block' }
    })
  );
};

const ALPHABET_LETTERS = 26;
const generateLetterCodes = num => {
  const longestWord = num.toString(ALPHABET_LETTERS).length;

  return times(num).map(i => {
    return leftPad(i.toString(ALPHABET_LETTERS), longestWord, 0) // convert to base-26
      .split('')
      .map(str => String.fromCharCode(97 + parseInt(str, ALPHABET_LETTERS))) // make each letter a-z
      .join('');
  });
};

export default (state = initialState, action) => {
  const { type, payload } = action;

  console.info(`action: ${type}`, payload);

  if (type === MOVE_CURSOR) {
    state = state.update('cursor', cursor => cursor.update('x', x => x + payload.x).update('y', y => y + payload.y));

    // TODO: make this work on whole width of the block, not just most-left part
    const hovered = state.getIn(['graph', 'blocks']).reduce((memo, block) => {
      // first match wins
      if (memo) {
        return memo;
      }

      const xAxisMatches = block.getIn(['position', 'x']) === state.getIn(['cursor', 'x']);

      if (!xAxisMatches) {
        return memo;
      }

      const blockSpec = state.getIn(['blockSpecs', block.get('name')]);
      const blockHovered = block.get('position').equals(state.get('cursor'));

      if (blockHovered) {
        return { type: 'block', blockId: block.get('id') };
      }

      const inputHoveredIdx = blockSpec.inputs.slice().reverse().findIndex((_, index) => {
        return xAxisMatches && state.getIn(['cursor', 'y']) === block.getIn(['position', 'y']) - (index + 1);
      });
      const inputHovered = inputHoveredIdx >= 0 ? blockSpec.inputs.slice().reverse()[inputHoveredIdx] : false;

      if (inputHovered) {
        return { type: 'input', blockId: block.get('id'), input: inputHovered };
      }

      const outputHoveredIdx = blockSpec.outputs.findIndex((_, index) => {
        return xAxisMatches && state.getIn(['cursor', 'y']) === block.getIn(['position', 'y']) + (index + 1);
      });
      const outputHovered = outputHoveredIdx >= 0 ? blockSpec.outputs[outputHoveredIdx] : false;

      if (outputHovered) {
        return { type: 'output', blockId: block.get('id'), output: outputHovered };
      }

      return memo;
    }, undefined);

    state = state.setIn(['ui', 'hovered'], fromJS(hovered));
  }

  if (type === UPSERT_BLOCK) {
    const { block } = payload;

    const creatingNewBlock = state.getIn(['ui', 'upsertBlockOverlay']) === NEW_BLOCK_NAME;

    state = state.setIn(['blockSpecs', block.name], block).setIn(['ui', 'upsertBlockOverlay'], false);

    if (creatingNewBlock) {
      state = createBlockOnBoard(state, block.name);
    }
  }

  if (type === CREATE_BLOCK) {
    const { block } = payload;

    if (block === NEW_BLOCK_NAME) {
      // open overlay if creating brand new block
      state = state.setIn(['ui', 'upsertBlockOverlay'], block);
    } else if (state.hasIn(['blockSpecs', block])) {
      // create on graph if using one of available blocks
      state = createBlockOnBoard(state, block);
    }

    state = state.setIn(['ui', 'newBlockPrompt'], false);
  }

  if (type === SHOW_NEW_BLOCK_PROMPT) {
    state = state.setIn(['ui', 'newBlockPrompt'], true);
  }

  if (type === CLOSE_NEW_BLOCK_PROMPT) {
    state = state.setIn(['ui', 'newBlockPrompt'], false);
  }

  if (type === CONNECT_FROM_INPUT) {
    const inputsCount = state
      .getIn(['graph', 'blocks'])
      .filter(block => block.get('id') !== payload.blockId)
      .reduce((memo, block) => {
        const { outputs } = state.getIn(['blockSpecs', block.get('name')]);
        return memo + (outputs || []).length;
      }, 0);

    const letters = generateLetterCodes(inputsCount);
    let letterCounter = 0;

    const possibleConnections = state.getIn(['graph', 'blocks']).reduce((memo, block) => {
      if (block.get('id') === payload.blockId) {
        return memo;
      }

      const { outputs } = state.getIn(['blockSpecs', block.get('name')]);

      const blockConnections = outputs.reduce((memo, key) => {
        const code = letters[letterCounter++];

        return {
          ...memo,
          [code]: {
            blockId: block.get('id'),
            code,
            output: key
          }
        };
      }, {});

      return {
        ...memo,
        ...blockConnections
      };
    }, {});

    if (Object.keys(possibleConnections).length > 0) {
      state = state.setIn(
        ['ui', 'newConnection'],
        fromJS({
          typed: '',
          from: {
            blockId: payload.blockId,
            input: payload.input
          },
          possibleConnections
        })
      );
    }
  }

  if (type === CONNECT_FROM_INPUT_TYPED_LETTER) {
    state = state.updateIn(['ui', 'newConnection', 'typed'], typed => typed + payload.letter);

    const letterCodes = state.getIn(['ui', 'newConnection', 'possibleConnections']);
    const letterCodeLength = letterCodes.first().length;

    const typedLetters = state.getIn(['ui', 'newConnection', 'typed']);

    if (typedLetters.length > letterCodeLength) {
      return state.setIn(['ui', 'newConnection'], false);
    } else if (typedLetters.length < letterCodeLength) {
      return state;
    } else {
      const matchingOutput = letterCodes.get(typedLetters);
      const id = uuid();

      return state
        .setIn(
          ['graph', 'connections', id],
          fromJS({
            id,
            fromId: state.getIn(['ui', 'newConnection', 'from', 'blockId']),
            fromInput: state.getIn(['ui', 'newConnection', 'from', 'input']),
            toId: matchingOutput.get('blockId'),
            toOutput: matchingOutput.get('output')
          })
        )
        .setIn(['ui', 'newConnection'], false);
    }
  }

  if (IS_DEBUG && state) {
    localStorage.setItem('state', stringifyState(state.toJS()));
  }

  return state;
};
