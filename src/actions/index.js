import {
  MOVE_CURSOR,
  CREATE_BLOCK,
  UPSERT_BLOCK,
  SHOW_NEW_BLOCK_PROMPT,
  CLOSE_NEW_BLOCK_PROMPT,
  CONNECT_INPUTS,
  CONNECT_OUTPUTS,
  CONNECT_INPUT_LETTER,
  CONNECT_OUTPUT_LETTER,
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

export const connectInputs = (blockId, inputName) => ({
  type: CONNECT_INPUTS,
  payload: { blockId, inputName }
});

export const connectOutputs = (blockId, inputName) => ({
  type: CONNECT_OUTPUTS,
  payload: { blockId, inputName }
});

export const connectInputLetter = letter => ({
  type: CONNECT_INPUT_LETTER,
  payload: { letter }
});

export const connectOutputLetter = letter => ({
  type: CONNECT_OUTPUT_LETTER,
  payload: { letter }
});
