import { MOVE_CURSOR, MAKE_NEW_BLOCK } from '../constants';

export const moveCursor = (x, y) => ({
  type: MOVE_CURSOR,
  payload: { x, y }
});

export const makeNewBlock = () => ({
  type: MAKE_NEW_BLOCK,
});
