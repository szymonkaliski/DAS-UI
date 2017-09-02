import { fromJS } from 'immutable';
import uuid from 'uuid/v4';
import times from 'lodash.times';
import leftPad from 'left-pad';

import { clamp, executeBlockSrc } from '../utils';

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
  EDIT_BLOCK_SPEC,
  FIND_BLOCK,
  FIND_BLOCK_TYPED_LETTER,
  GRID_SIZE,
  IS_DEBUG,
  MIN_BLOCK_HEIGHT,
  MIN_BLOCK_WIDTH,
  MOVE_BLOCK,
  MOVE_CURSOR,
  NEW_BLOCK_NAME,
  READ_GRAPH_FROM_DB_DONE,
  RESIZE_BLOCK,
  SAVE_GRAPH_TO_DB_DONE,
  SET_BLOCK_STATE,
  SHOW_NEW_BLOCK_PROMPT,
  UPDATE_CONTENT_SIZE,
  UPSERT_BLOCK,
} from '../constants';

let initialState = fromJS({
  blockSpecs: {},
  graph: {
    blocks: {},
    connections: {}
  },
  ui: {
    grid: {
      marginLeft: 0,
      marginTop: 0,
      width: 0,
      height: 0,
      offsetX: 0,
      offsetY: 0
    },
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

const TEMP_BLOCK_BUTTON = `{
  name: 'button',
  inputs: [],
  outputs: ['click'],
  code: ({ outputs, state }) => {
    state.subscribe(click => {
      outputs.click.onNext(click);
    });
  },
  ui: ({ state, setState }) => {
    return window.DOM.button(
      {
        onClick: () => setState({ click: (new Date()).getTime() })
      },
      state.click ? ('lastclick: ' + state.click) : 'clickme'
    );
  }
}`;

const TEMP_BLOCK_LOGGER = `{
  name: 'logger',
  inputs: ['log'],
  outputs: [],

  code: ({ inputs, setState }) => {
    inputs.log.subscribe(log => {
      setState({ log });
    });
  },

  ui: ({ state }) => {
    return window.DOM.pre(
      {},
      typeof(state.log) == 'object'
        ? JSON.stringify(state.log, null, 2)
        : state.log
    );
  }
}`;

const TEMP_BLOCK_TICKER = `{
  name: 'ticker',
  inputs: [],
  outputs: ['tick'],
  code: ({ outputs, state, setState }) => {
    var counter = 0;

    this.intervalHandle = setInterval(() => {
      outputs.tick.onNext(counter);
      setState({ counter });
      counter++;
    }, 1000);
  },

  cleanup: () => {
    this.clearInterval(this.intervalHandle);
  },

  ui: ({ state }) => {
    return 'tick: ' + state.counter;
  }
}`;

if (IS_DEBUG) {
  const parsed = JSON.parse(localStorage.getItem('state'));

  window.clearState = () => {
    localStorage.setItem('state', null);
    window.location.reload();
  };

  if (parsed) {
    initialState = fromJS(parsed);
  }
}

const storeBlockSpec = (state, blockSpecStr) => {
  const executed = executeBlockSrc(blockSpecStr);

  return state.setIn(
    ['blockSpecs', executed.name],
    fromJS({
      name: executed.name,
      inputs: executed.inputs,
      outputs: executed.outputs,
      hasUI: !!executed.ui,
      src: blockSpecStr
    })
  );
};

// for debug...
initialState = [TEMP_BLOCK_BUTTON, TEMP_BLOCK_LOGGER, TEMP_BLOCK_TICKER].reduce(
  (memo, blockSrc) => storeBlockSpec(memo, blockSrc),
  initialState
);

const createBlockOnBoard = (state, block) => {
  const id = uuid();

  return state
    .setIn(
      ['graph', 'blocks', id],
      fromJS({
        id,
        name: block,
        position: state.getIn(['ui', 'cursor']).toJS(),
        state: {},
        size: {
          width: DEFAULT_BLOCK_WIDTH,
          height: state.getIn(['blockSpecs', block, 'hasUI']) ? 5 : 1
        }
      })
    )
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
      return memo + state.getIn(['blockSpecs', block.get('name'), connectToKey]).count();
    }, 0);

  const letters = generateLetterCodes(possibleConnectionsCount);
  let letterCounter = 0;

  const possibleConnections = state.getIn(['graph', 'blocks']).reduce((memo, block) => {
    if (block.get('id') === blockId) {
      return memo;
    }

    const blockConnections = state
      .getIn(['blockSpecs', block.get('name'), connectToKey])
      .toJS()
      .reduce((memo, key) => {
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
    const cursor = state
      .getIn(['ui', 'cursor'])
      .update('x', x => x + payload.x)
      .update('y', y => y + payload.y);

    state = state.setIn(['ui', 'cursor'], cursor).updateIn(['ui', 'grid'], grid => {
      if (cursor.get('x') < grid.get('offsetX')) {
        grid = grid.set('offsetX', cursor.get('x'));
      }

      if (cursor.get('x') >= grid.get('offsetX') + grid.get('width') - 1) {
        grid = grid.set('offsetX', grid.get('offsetX') + 1);
      }

      if (cursor.get('y') < grid.get('offsetY')) {
        grid = grid.set('offsetY', cursor.get('y'));
      }

      if (cursor.get('y') >= grid.get('offsetY') + grid.get('height') - 1) {
        grid = grid.set('offsetY', grid.get('offsetY') + 1);
      }

      return grid;
    });

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

      const inputHoveredIdx = blockSpec
        .get('inputs')
        .toJS()
        .slice()
        .reverse()
        .findIndex((_, index) => {
          return xAxisMatches && cursor.get('y') === position.get('y') - (index + 1);
        });

      const inputHovered =
        inputHoveredIdx >= 0
          ? blockSpec
              .get('inputs')
              .toJS()
              .slice()
              .reverse()[inputHoveredIdx]
          : false;

      if (inputHovered) {
        return { type: 'input', blockId: block.get('id'), input: inputHovered };
      }

      const outputHoveredIdx = blockSpec
        .get('outputs')
        .toJS()
        .findIndex((_, index) => {
          return xAxisMatches && cursor.get('y') === position.get('y') + size.get('height') + index;
        });
      const outputHovered = outputHoveredIdx >= 0 ? blockSpec.get('outputs').toJS()[outputHoveredIdx] : false;

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
      const size = state
        .getIn(['graph', 'blocks', hovered.get('blockId'), 'size'])
        .update('width', width => Math.max(MIN_BLOCK_WIDTH, width + payload.w))
        .update('height', height => Math.max(MIN_BLOCK_HEIGHT, height + payload.h));

      const position = state.getIn(['graph', 'blocks', hovered.get('blockId'), 'position']);

      state = state
        .setIn(['graph', 'blocks', hovered.get('blockId'), 'size'], size)
        .updateIn(['ui', 'cursor'], cursor =>
          cursor
            .update('x', x => clamp(x + payload.w, position.get('x'), position.get('x') + size.get('width')))
            .update('y', y => clamp(y + payload.h, position.get('y'), position.get('y') + size.get('height')))
        );
    }
  }

  if (type === UPSERT_BLOCK) {
    const { block } = payload;

    const creatingNewBlock = state.getIn(['ui', 'upsertBlockOverlay']) === NEW_BLOCK_NAME;

    state = storeBlockSpec(state, block).setIn(['ui', 'upsertBlockOverlay'], false);

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

  if (type === EDIT_BLOCK_SPEC) {
    const { blockId } = payload;

    const blockSpecName = state.getIn(['graph', 'blocks', blockId, 'name']);
    const blockSpec = state.getIn(['blockSpecs', blockSpecName, 'src']);

    if (blockSpec) {
      state = state.setIn(['ui', 'upsertBlockOverlay'], blockSpec);
    } else {
      console.error(`block spec doesn't exist: ${state.getIn(['graph', 'blocks', blockId, 'name'])}`);
    }
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

  if (type === DELETE_CONNECTION_FROM_INPUT) {
    const { blockId, input } = payload;

    state = state.updateIn(['graph', 'connections'], connections =>
      connections.filter(connection => !(connection.get('toId') === blockId && connection.get('toInput') === input))
    );
  }

  if (type === DELETE_CONNECTION_FROM_OUTPUT) {
    const { blockId, output } = payload;

    state = state.updateIn(['graph', 'connections'], connections =>
      connections.filter(connection => !(connection.get('fromId') === blockId && connection.get('toOutput') === output))
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
      state = state.mergeIn(['graph', 'blocks', payload.blockId, 'state'], fromJS(payload.patch));
    }
  }

  if (type === UPDATE_CONTENT_SIZE) {
    const { width, height } = payload;

    const gridWidthCount = Math.floor(width / GRID_SIZE) - 1;
    const gridHeightCount = Math.floor(height / GRID_SIZE) - 1;
    const gridWidth = gridWidthCount * GRID_SIZE;
    const gridHeight = gridHeightCount * GRID_SIZE;
    const gridMarginLeft = Math.floor((width - gridWidth) / 2 + GRID_SIZE / 2);
    const gridMarginTop = Math.floor((height - gridHeight) / 2 + GRID_SIZE / 2);

    state = state.setIn(
      ['ui', 'grid'],
      fromJS({
        marginLeft: gridMarginLeft,
        marginTop: gridMarginTop,
        width: gridWidthCount,
        height: gridHeightCount,
        offsetX: 0,
        offsetY: 0
      })
    );
  }

  if (type === SAVE_GRAPH_TO_DB_DONE) {
    state = state.set('databaseKey', payload.key);
  }

  if (type === READ_GRAPH_FROM_DB_DONE) {
    state = fromJS(payload.data).set('databaseKey', payload.key);
  }

  if (IS_DEBUG && state) {
    localStorage.setItem('state', JSON.stringify(state.toJS()));
  }

  return state;
};
