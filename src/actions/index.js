import { MOVE_CURSOR, UPSERT_BLOCK } from '../constants';

export const moveCursor = (x, y) => ({
  type: MOVE_CURSOR,
  payload: { x, y }
});

export const upsertBlock = block => ({
  type: UPSERT_BLOCK,
  payload: { block }
});
