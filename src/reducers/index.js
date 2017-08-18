import { fromJS } from 'immutable';
import uuid from 'uuid/v4';

import { IS_DEBUG, MOVE_CURSOR, CREATE_BLOCK, UPSERT_BLOCK, NEW_BLOCK_NAME } from '../constants';

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
  overlays: {
    upsertBlock: false
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
      position: state.get('cursor').toJS()
    })
  );
};

export default (state = initialState, action) => {
  const { type, payload } = action;

  if (type === MOVE_CURSOR) {
    state = state.update('cursor', cursor => cursor.update('x', x => x + payload.x).update('y', y => y + payload.y));
  }

  if (type === UPSERT_BLOCK) {
    const { block } = payload;

    const creatingNewBlock = state.getIn(['overlays', 'upsertBlock']) === NEW_BLOCK_NAME;

    state = state.setIn(['blockSpecs', block.name], block).setIn(['overlays', 'upsertBlock'], false);

    if (creatingNewBlock) {
      state = createBlockOnBoard(state, block.name);
    }
  }

  if (type === CREATE_BLOCK) {
    const { block } = payload;

    if (block === NEW_BLOCK_NAME) {
      // open overlay if creating brand new block
      state = state.setIn(['overlays', 'upsertBlock'], block);
    } else if (state.hasIn(['blockSpecs', block])) {
      // create on graph if using one of available blocks
      state = createBlockOnBoard(state, block);
    }
  }

  // FIXME: blockSpecs[].code doesn't stringify...
  if (IS_DEBUG && state) {
    localStorage.setItem('state', stringifyState(state.toJS()));
  }

  return state;
};
