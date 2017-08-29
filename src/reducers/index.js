import { fromJS } from 'immutable';
import uuid from 'uuid/v4';
import times from 'lodash.times';
import leftPad from 'left-pad';

import {
  CANCEL_CONNECT_OR_FIND,
  CANCEL_UPSERT_BLOCK,
  CLOSE_NEW_BLOCK_PROMPT,
  CONNECT_FROM_INPUT,
  CONNECT_FROM_INPUT_TYPED_LETTER,
  CONNECT_FROM_OUTPUT,
  CONNECT_FROM_OUTPUT_TYPED_LETTER,
  CREATE_BLOCK,
  DEFAULT_BLOCK_WIDTH,
  DELETE_BLOCK,
  DELETE_CONNECTION_FROM_INPUT,
  DELETE_CONNECTION_FROM_OUTPUT,
  FIND_BLOCK,
  FIND_BLOCK_TYPED_LETTER,
  IS_DEBUG,
  MIN_BLOCK_HEIGHT,
  MIN_BLOCK_WIDTH,
  MOVE_BLOCK,
  MOVE_CURSOR,
  NEW_BLOCK_NAME,
  RESIZE_BLOCK,
  SET_BLOCK_STATE,
  SHOW_NEW_BLOCK_PROMPT,
  UPSERT_BLOCK
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
  blockSpecs: {},
  graph: {
    blocks: {},
    connections: {}
  },
  ui: {
    cursor: {
      x: 0,
      y: 0
    },
    hovered: false,
    upsertBlockOverlay: false,
    newBlockPrompt: false,
    newConnection: false,
    findingBlock: false
  }
});

const TEMP_BLOCK_BUTTON = {
  name: 'button',
  inputs: [],
  outputs: ['click'],
  code: ({ outputs, state }) => {
    state.subscribe(click => {
      console.log('state got', click, 'outputing through click...');
      outputs.click.onNext(click);
    });
  },
  ui: ({ setState }) => {
    return window.DOM.button({ onClick: () => setState({ click: new Date() }) }, 'clickme');
  }
};

const TEMP_BLOCK_LOGGER = {
  name: 'logger',
  inputs: ['log'],
  outputs: [],
  code: ({ inputs, state, setState }) => {
    inputs.log.subscribe(text => console.log(text));
  }
};

const TEMP_BLOCK_TICKER = {
  name: 'ticker',
  inputs: [],
  outputs: ['tick'],
  code: ({ outputs, state, setState }) => {
    var counter = 0;

    setInterval(() => {
      outputs.tick.onNext(counter);
      setState({ counter });
      counter++;
    }, 1000);

    // state.subscribe(val => {
    //   console.log('ticker state updated', val);
    // })
  },
  ui: ({ counter }) => {
    return 'tick: ' + counter;
  }
};

initialState = initialState
  .setIn(['blockSpecs', 'logger'], TEMP_BLOCK_LOGGER)
  .setIn(['blockSpecs', 'button'], TEMP_BLOCK_BUTTON)
  .setIn(['blockSpecs', 'ticker'], TEMP_BLOCK_TICKER);

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
  const blockSpec = state.getIn(['blockSpecs', block]);

  return state
    .setIn(
      ['graph', 'blocks', id],
      fromJS({
        id,
        name: block,
        position: state.getIn(['ui', 'cursor']).toJS(),
        size: { width: DEFAULT_BLOCK_WIDTH, height: blockSpec.ui ? 5 : 1 }
      })
    )
    .setIn(['graph', 'blocks', id, 'state'], {}) // state is plain object!
    .setIn(['ui', 'hovered'], fromJS({ type: 'block', blockId: id }));
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

const CONNECTION_TYPES = {
  INPUT_TO_OUTPUT: 'INPUT_TO_OUTPUT',
  OUTPUT_TO_INPUT: 'OUTPUT_TO_INPUT'
};

const generateConnectionState = (state, blockId, connector, type) => {
  const connectToKey = type === CONNECTION_TYPES.INPUT_TO_OUTPUT ? 'outputs' : 'inputs';

  const possibleConnectionsCount = state
    .getIn(['graph', 'blocks'])
    .filter(block => block.get('id') !== blockId)
    .reduce((memo, block) => {
      const blockSpec = state.getIn(['blockSpecs', block.get('name')]);
      return memo + (blockSpec[connectToKey] || []).length;
    }, 0);

  const letters = generateLetterCodes(possibleConnectionsCount);
  let letterCounter = 0;

  const possibleConnections = state.getIn(['graph', 'blocks']).reduce((memo, block) => {
    if (block.get('id') === blockId) {
      return memo;
    }

    const blockSpec = state.getIn(['blockSpecs', block.get('name')]);

    const blockConnections = blockSpec[connectToKey].reduce((memo, key) => {
      const code = letters[letterCounter++];

      return {
        ...memo,
        [code]: {
          blockId: block.get('id'),
          code,
          connector: key
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
      fromJS({ typed: '', from: { blockId, connector }, possibleConnections })
    );
  }

  return state;
};

const processConnectionStateLetter = (state, typedLetter, type) => {
  state = state.updateIn(['ui', 'newConnection', 'typed'], typed => typed + typedLetter);

  const letterCodes = state.getIn(['ui', 'newConnection', 'possibleConnections']);
  const letterCodeLength = letterCodes.keySeq().first().length;

  const typedLetters = state.getIn(['ui', 'newConnection', 'typed']);

  const typedTooManyLetters = typedLetters.length > letterCodeLength;
  const noMatchingCode = typedLetters.length === letterCodeLength && !letterCodes.has(typedLetters);

  if (typedTooManyLetters || noMatchingCode) {
    state = state.setIn(['ui', 'newConnection'], false);
  } else if (letterCodes.has(typedLetters)) {
    const matchingConnector = letterCodes.get(typedLetters);
    const id = uuid();

    const toId =
      type === CONNECTION_TYPES.INPUT_TO_OUTPUT
        ? state.getIn(['ui', 'newConnection', 'from', 'blockId'])
        : matchingConnector.get('blockId');

    const toInput =
      type === CONNECTION_TYPES.INPUT_TO_OUTPUT
        ? state.getIn(['ui', 'newConnection', 'from', 'connector'])
        : matchingConnector.get('connector');

    const fromId =
      type === CONNECTION_TYPES.INPUT_TO_OUTPUT
        ? matchingConnector.get('blockId')
        : state.getIn(['ui', 'newConnection', 'from', 'blockId']);

    const fromOutput =
      type === CONNECTION_TYPES.INPUT_TO_OUTPUT
        ? matchingConnector.get('connector')
        : state.getIn(['ui', 'newConnection', 'from', 'connector']);

    const previousConnectionToInput = state
      .getIn(['graph', 'connections'])
      .find(connection => connection.get('toId') === toId && connection.get('toInput') === toInput);

    if (previousConnectionToInput) {
      state = state.deleteIn(['graph', 'connections', previousConnectionToInput.get('id')]);
    }

    state = state
      .setIn(['graph', 'connections', id], fromJS({ id, fromId, fromOutput, toId, toInput }))
      .setIn(['ui', 'newConnection'], false);
  }

  return state;
};

export default (state = initialState, action) => {
  const { type, payload } = action;

  console.info(`action: ${type}`, payload || {});

  if (type === MOVE_CURSOR) {
    state = state.updateIn(['ui', 'cursor'], cursor =>
      cursor.update('x', x => x + payload.x).update('y', y => y + payload.y)
    );

    const hovered = state.getIn(['graph', 'blocks']).reduce((memo, block) => {
      // first match wins
      if (memo) {
        return memo;
      }

      const cursor = state.getIn(['ui', 'cursor']);
      const position = block.get('position');
      const size = block.get('size');

      const xAxisMatches =
        position.get('x') <= cursor.get('x') && cursor.get('x') < position.get('x') + size.get('width');

      if (!xAxisMatches) {
        return memo;
      }

      const blockSpec = state.getIn(['blockSpecs', block.get('name')]);
      const blockHovered =
        position.get('y') <= cursor.get('y') && cursor.get('y') < position.get('y') + size.get('height');

      if (blockHovered) {
        return { type: 'block', blockId: block.get('id') };
      }

      const inputHoveredIdx = blockSpec.inputs
        .slice()
        .reverse()
        .findIndex((_, index) => {
          return xAxisMatches && cursor.get('y') === position.get('y') - (index + 1);
        });
      const inputHovered = inputHoveredIdx >= 0 ? blockSpec.inputs.slice().reverse()[inputHoveredIdx] : false;

      if (inputHovered) {
        return { type: 'input', blockId: block.get('id'), input: inputHovered };
      }

      const outputHoveredIdx = blockSpec.outputs.findIndex((_, index) => {
        return xAxisMatches && cursor.get('y') === position.get('y') + size.get('height') + index;
      });
      const outputHovered = outputHoveredIdx >= 0 ? blockSpec.outputs[outputHoveredIdx] : false;

      if (outputHovered) {
        return { type: 'output', blockId: block.get('id'), output: outputHovered };
      }

      return memo;
    }, undefined);

    state = state.setIn(['ui', 'hovered'], fromJS(hovered));
  }

  if (type === MOVE_BLOCK) {
    const hovered = state.getIn(['ui', 'hovered']);

    if (hovered) {
      state = state
        .updateIn(['ui', 'cursor'], cursor => cursor.update('x', x => x + payload.x).update('y', y => y + payload.y))
        .updateIn(['graph', 'blocks', hovered.get('blockId'), 'position'], position =>
          position.update('x', x => x + payload.x).update('y', y => y + payload.y)
        );
    }
  }

  if (type === RESIZE_BLOCK) {
    const hovered = state.getIn(['ui', 'hovered']);

    if (hovered) {
      state = state
        .updateIn(['graph', 'blocks', hovered.get('blockId'), 'size'], size =>
          size
            .update('width', width => Math.max(MIN_BLOCK_WIDTH, width + payload.w))
            .update('height', height => Math.max(MIN_BLOCK_HEIGHT, height + payload.h))
        )
        .updateIn(['ui', 'cursor'], cursor => cursor.update('x', x => x + payload.w).update('y', y => y + payload.h));
    }
  }

  if (type === UPSERT_BLOCK) {
    const { block } = payload;

    const creatingNewBlock = state.getIn(['ui', 'upsertBlockOverlay']) === NEW_BLOCK_NAME;

    state = state.setIn(['blockSpecs', block.name], block).setIn(['ui', 'upsertBlockOverlay'], false);

    if (creatingNewBlock) {
      state = createBlockOnBoard(state, block.name);
    }
  }

  if (type === CANCEL_UPSERT_BLOCK) {
    state = state.setIn(['ui', 'upsertBlockOverlay'], false);
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
    state = generateConnectionState(state, payload.blockId, payload.input, CONNECTION_TYPES.INPUT_TO_OUTPUT);
  }

  if (type === CONNECT_FROM_OUTPUT) {
    state = generateConnectionState(state, payload.blockId, payload.output, CONNECTION_TYPES.OUTPUT_TO_INPUT);
  }

  if (type === CONNECT_FROM_INPUT_TYPED_LETTER) {
    state = processConnectionStateLetter(state, payload.letter, CONNECTION_TYPES.INPUT_TO_OUTPUT);
  }

  if (type === CONNECT_FROM_OUTPUT_TYPED_LETTER) {
    state = processConnectionStateLetter(state, payload.letter, CONNECTION_TYPES.OUTPUT_TO_INPUT);
  }

  if (type === DELETE_BLOCK) {
    const { blockId } = payload;

    state = state
      .deleteIn(['graph', 'blocks', blockId])
      .updateIn(['graph', 'connections'], connections =>
        connections.filter(connection => connection.get('fromId') !== blockId && connection.get('toId') !== blockId)
      );
  }

  // TODO: if block has multiple inputs, deletes wrong things
  if (type === DELETE_CONNECTION_FROM_INPUT) {
    const { blockId, input } = payload;

    state = state.updateIn(['graph', 'connections'], connections =>
      connections.filter(connection => connection.get('toId') !== blockId && connection.get('toInput') !== input)
    );
  }

  // TODO: if block has multiple outputs, deletes wrong things
  if (type === DELETE_CONNECTION_FROM_OUTPUT) {
    const { blockId, output } = payload;

    state = state.updateIn(['graph', 'connections'], connections =>
      connections.filter(connection => connection.get('fromId') !== blockId && connection.get('toOutput') !== output)
    );
  }

  if (type === FIND_BLOCK) {
    const blockCount = state.getIn(['graph', 'blocks']).count();

    const blockLetters = generateLetterCodes(blockCount).reduce((memo, letter, i) => {
      return {
        ...memo,
        [letter]: state
          .getIn(['graph', 'blocks'])
          .valueSeq()
          .getIn([i, 'id'])
      };
    }, {});

    if (blockCount > 0) {
      state = state.setIn(['ui', 'findingBlock'], fromJS({ typed: '', blockLetters }));
    }
  }

  if (type === FIND_BLOCK_TYPED_LETTER) {
    const { letter } = payload;

    state = state.updateIn(['ui', 'findingBlock', 'typed'], typed => typed + letter);

    const typedLetters = state.getIn(['ui', 'findingBlock', 'typed']);
    const letterCodes = state.getIn(['ui', 'findingBlock', 'blockLetters']);
    const letterCodeLength = letterCodes.keySeq().first().length;

    const typedTooManyLetters = typedLetters.length > letterCodeLength;
    const noMatchingCode = typedLetters.length === letterCodeLength && !letterCodes.has(typedLetters);

    if (typedTooManyLetters || noMatchingCode) {
      state = state.setIn(['ui', 'findingBlock'], false);
    } else if (letterCodes.has(typedLetters)) {
      const matchingBlockId = letterCodes.get(typedLetters);

      state = state
        .setIn(['ui', 'cursor'], state.getIn(['graph', 'blocks', matchingBlockId, 'position']))
        .setIn(['ui', 'hovered'], fromJS({ type: 'block', blockId: matchingBlockId }))
        .setIn(['ui', 'findingBlock'], false);
    }
  }

  if (type === CANCEL_CONNECT_OR_FIND) {
    state = state.setIn(['ui', 'findingBlock'], false).setIn(['ui', 'newConnection'], false);
  }

  if (type === SET_BLOCK_STATE) {
    const blockExists = state.hasIn(['graph', 'blocks', payload.blockId]);

    if (blockExists) {
      const currentState = state.getIn(['graph', 'blocks', payload.blockId, 'state']);

      // mergeIn wasn't working here, I want state to be plain object inside of immutable map - it's easier to manage on graph side
      state = state.setIn(['graph', 'blocks', payload.blockId, 'state'], {
        ...(currentState || {}),
        ...payload.patch
      });
    }
  }

  if (IS_DEBUG && state) {
    localStorage.setItem('state', stringifyState(state.toJS()));
  }

  return state;
};
