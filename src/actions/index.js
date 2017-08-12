import { MOVE_CURSOR, OPEN_CREATE_BLOCK, UPSERT_BLOCK } from '../constants';

export const moveCursor = (x, y) => ({
  type: MOVE_CURSOR,
  payload: { x, y }
});

export const openCreateBlock = block => ({
  type: OPEN_CREATE_BLOCK,
  payload: { block }
});

export const upsertBlock = block => ({
  type: UPSERT_BLOCK,
  payload: { block }
});
