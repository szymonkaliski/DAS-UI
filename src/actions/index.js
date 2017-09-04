import firebase from 'firebase/app';
import 'firebase/database';

import {
  CANCEL_CONNECT_OR_FIND,
  CANCEL_UPSERT_BLOCK,
  CLOSE_NEW_BLOCK_PROMPT,
  CONNECT_FROM_INPUT,
  CONNECT_FROM_INPUT_TYPED_LETTER,
  CONNECT_FROM_OUTPUT,
  CONNECT_FROM_OUTPUT_TYPED_LETTER,
  CREATE_BLOCK,
  DELETE_BLOCK,
  DELETE_CONNECTION_FROM_INPUT,
  DELETE_CONNECTION_FROM_OUTPUT,
  EDIT_BLOCK_SPEC,
  FIND_BLOCK,
  FIND_BLOCK_TYPED_LETTER,
  HIDE_HELP,
  MOVE_BLOCK,
  MOVE_CURSOR,
  READ_GRAPH_FROM_DB_DONE,
  RESIZE_BLOCK,
  SAVE_GRAPH_TO_DB_DONE,
  SET_BLOCK_STATE,
  SHOW_HELP,
  SHOW_NEW_BLOCK_PROMPT,
  TOGGLE_HELP,
  UPDATE_CONTENT_SIZE,
  UPSERT_BLOCK
} from '../constants';

export const moveCursor = (x, y) => ({
  type: MOVE_CURSOR,
  payload: { x, y }
});

export const moveBlock = (x, y) => ({
  type: MOVE_BLOCK,
  payload: { x, y }
});

export const resizeBlock = (w, h) => ({
  type: RESIZE_BLOCK,
  payload: { w, h }
});

export const createBlock = block => ({
  type: CREATE_BLOCK,
  payload: { block }
});

export const upsertBlock = block => ({
  type: UPSERT_BLOCK,
  payload: { block }
});

export const cancelUpsertBlock = () => ({
  type: CANCEL_UPSERT_BLOCK
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

export const deleteBlock = blockId => ({
  type: DELETE_BLOCK,
  payload: { blockId }
});

export const deleteConnectionFromInput = (blockId, input) => ({
  type: DELETE_CONNECTION_FROM_INPUT,
  payload: { blockId, input }
});

export const deleteConnectionFromOutput = (blockId, output) => ({
  type: DELETE_CONNECTION_FROM_OUTPUT,
  payload: { blockId, output }
});

export const findBlock = () => ({
  type: FIND_BLOCK
});

export const findBlockTypedLetter = letter => ({
  type: FIND_BLOCK_TYPED_LETTER,
  payload: { letter }
});

export const setBlockState = (blockId, patch) => ({
  type: SET_BLOCK_STATE,
  payload: { blockId, patch }
});

export const cancelConnectOrFind = () => ({
  type: CANCEL_CONNECT_OR_FIND
});

export const editBlockSpec = blockId => ({
  type: EDIT_BLOCK_SPEC,
  payload: { blockId }
});

export const updateContentSize = (width, height) => ({
  type: UPDATE_CONTENT_SIZE,
  payload: { width, height }
});

export const saveGraphToDB = () => (dispatch, getState) => {
  const data = getState().toJS();

  // store parent database key
  if (data.databaseKey) {
    data.parentDatabaseKey = data.databaseKey;
    delete data.databaseKey;
  }

  firebase
    .database()
    .ref('graphs')
    .push(JSON.stringify(data))
    .then(({ key }) => dispatch(saveGraphToDBDone(key)));
};

export const saveGraphToDBDone = key => ({
  type: SAVE_GRAPH_TO_DB_DONE,
  payload: { key }
});

export const readGraphFromDB = (id, opts) => dispatch => {
  firebase
    .database()
    .ref(`graphs/${id}`)
    .once('value')
    .then(snap => {
      const val = JSON.parse(snap.val());
      dispatch(readGraphFromDBDone(snap.key, val, opts))
    });
};

export const readGraphFromDBDone = (key, data, opts) => ({
  type: READ_GRAPH_FROM_DB_DONE,
  payload: { data, key, opts }
});

export const toggleHelp = () => ({
  type: TOGGLE_HELP
});

export const showHelp = () => ({
  type: SHOW_HELP
});

export const hideHelp = () => ({
  type: HIDE_HELP
});
