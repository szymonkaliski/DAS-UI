import { MOVE_CURSOR } from '../constants';

export const moveCursor = (x, y) => ({
  type: MOVE_CURSOR,
  payload: { x, y }
});
