import { fromJS } from 'immutable';

import { MOVE_CURSOR, UPSERT_BLOCK } from '../constants';

const initialState = fromJS({
  cursor: {
    x: 0,
    y: 0
  },
  blocks: {}
});

export default (state = initialState, action) => {
  const { type, payload } = action;

  if (type === MOVE_CURSOR) {
    state = state.update('cursor', cursor => cursor.update('x', x => x + payload.x).update('y', y => y + payload.y));
  }

  if (type === UPSERT_BLOCK) {
    const { block } = payload;

    state = state.setIn('blocks', block.name, block);
  }

  // console.info(JSON.stringify(state.toJS(), null, 2));

  return state;
};
