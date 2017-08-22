import {
  MOVE_CURSOR,
  CREATE_BLOCK,
  UPSERT_BLOCK,
  SHOW_NEW_BLOCK_PROMPT,
  CLOSE_NEW_BLOCK_PROMPT,
  CONNECT_FROM_INPUT,
  CONNECT_FROM_OUTPUT,
  CONNECT_FROM_INPUT_TYPED_LETTER,
  CONNECT_FROM_OUTPUT_TYPED_LETTER
} from '../constants';

export const moveCursor = (x, y) => ({
  type: MOVE_CURSOR,
  payload: { x, y }
});

export const createBlock = block => ({
  type: CREATE_BLOCK,
  payload: { block }
});

export const upsertBlock = block => ({
  type: UPSERT_BLOCK,
  payload: { block }
});

export const showNewBlockPrompt = () => ({
  type: SHOW_NEW_BLOCK_PROMPT
});

export const closeNewBlockPrompt = () => ({
  type: CLOSE_NEW_BLOCK_PROMPT
});

export const connectFromInput = (blockId, input) => ({
  type: CONNECT_FROM_INPUT,
  payload: { blockId, input }
});

export const connectFromOutput = (blockId, output) => ({
  type: CONNECT_FROM_OUTPUT,
  payload: { blockId, output }
});

export const connectFromInputTypedLetter = letter => ({
  type: CONNECT_FROM_INPUT_TYPED_LETTER,
  payload: { letter }
});

export const connectFromOutputTypedLetter = letter => ({
  type: CONNECT_FROM_OUTPUT_TYPED_LETTER,
  payload: { letter }
});
