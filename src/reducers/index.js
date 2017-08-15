import { fromJS } from 'immutable';
import uuid from 'uuid/v4';

import { IS_DEBUG, MOVE_CURSOR, CREATE_BLOCK, UPSERT_BLOCK, NEW_BLOCK_NAME } from '../constants';

const defaultInitialState = fromJS({
  cursor: {
    x: 0,
    y: 0
  },
  availableBlocks: {},
  graph: {
    blocks: {},
    connections: {}
  },
  overlays: {
    upsertBlock: false
  }
});

let parsed;

if (IS_DEBUG) {
  try {
    parsed = JSON.parse(localStorage.getItem('state'));
  } catch (e) {
    console.error(e);
  }

  window.clearState = () => {
    localStorage.setItem('state', null);
    window.location.reload();
  };
}

const initialState = fromJS(parsed || defaultInitialState);

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

    state = state.setIn(['availableBlocks', block.name], block).setIn(['overlays', 'upsertBlock'], false);

    if (creatingNewBlock) {
      state = createBlockOnBoard(state, block.name);
    }
  }

  if (type === CREATE_BLOCK) {
    const { block } = payload;

    if (block === NEW_BLOCK_NAME) {
      // open overlay if creating brand new block
      state = state.setIn(['overlays', 'upsertBlock'], block);
    } else if (state.hasIn(['availableBlocks', block])) {
      // create on graph if using one of available blocks
      state = createBlockOnBoard(state, block);
    }
  }

  if (IS_DEBUG && state) {
    localStorage.setItem('state', JSON.stringify(state.toJS()));
  }

  return state;
};
