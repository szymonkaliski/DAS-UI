import { fromJS } from 'immutable';

import { MOVE_CURSOR, MAKE_NEW_BLOCK } from '../constants';

const initialState = fromJS({
  cursor: {
    x: 0,
    y: 0
  }
});

export default (state = initialState, action) => {
  const { type, payload } = action;

  if (type === MOVE_CURSOR) {
    state = state.update('cursor', cursor => cursor.update('x', x => x + payload.x).update('y', y => y + payload.y));
  }

  if (type === MAKE_NEW_BLOCK) {

  }

  // console.info(JSON.stringify(state.toJS(), null, 2));

  return state;
};
