import { fromJS } from 'immutable';

import { MOVE_CURSOR, OPEN_CREATE_BLOCK, UPSERT_BLOCK } from '../constants';

const initialState = fromJS({
  cursor: {
    x: 0,
    y: 0
  },
  blocks: {},
  overlays: {
    createBlock: false
  }
});

export default (state = initialState, action) => {
  const { type, payload } = action;

  if (type === MOVE_CURSOR) {
    state = state.update('cursor', cursor => cursor.update('x', x => x + payload.x).update('y', y => y + payload.y));
  }

  if (type === UPSERT_BLOCK) {
    const { block } = payload;
    state = state.setIn(['blocks', block.name], block).setIn(['overlays', 'createBlock'], false);
  }

  if (type === OPEN_CREATE_BLOCK) {
    const { block } = payload;
    state = state.setIn(['overlays', 'createBlock'], block);
  }

  // console.info(JSON.stringify(state.toJS(), null, 2));

  return state;
};
