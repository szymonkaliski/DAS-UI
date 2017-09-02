export const IS_DEBUG = window.location.search.indexOf('debug') >= 0;

export const GRID_SIZE = 24;
export const DEFAULT_BLOCK_WIDTH = 5;
export const MIN_BLOCK_WIDTH = 3;
export const MIN_BLOCK_HEIGHT = 1;

export const NEW_BLOCK_NAME = '__NEW_BLOCK__';

export const CANCEL_CONNECT_OR_FIND = 'CANCEL_CONNECT_OR_FIND';
export const CANCEL_UPSERT_BLOCK = 'CANCEL_UPSERT_BLOCK';
export const CLOSE_NEW_BLOCK_PROMPT = 'CLOSE_NEW_BLOCK_PROMPT';
export const CONNECT_FROM_INPUT = 'CONNECT_FROM_INPUT';
export const CONNECT_FROM_INPUT_TYPED_LETTER = 'CONNECT_FROM_INPUT_TYPED_LETTER';
export const CONNECT_FROM_OUTPUT = 'CONNECT_FROM_OUTPUT';
export const CONNECT_FROM_OUTPUT_TYPED_LETTER = 'CONNECT_FROM_OUTPUT_TYPED_LETTER';
export const CREATE_BLOCK = 'CREATE_BLOCK';
export const DELETE_BLOCK = 'DELETE_BLOCK';
export const DELETE_CONNECTION_FROM_INPUT = 'DELETE_CONNECTION_FROM_INPUT';
export const DELETE_CONNECTION_FROM_OUTPUT = 'DELETE_CONNECTION_FROM_OUTPUT';
export const EDIT_BLOCK_SPEC = 'EDIT_BLOCK_SPEC';
export const FIND_BLOCK = 'FIND_BLOCK';
export const FIND_BLOCK_TYPED_LETTER = 'FIND_BLOCK_TYPED_LETTER';
export const MOVE_BLOCK = 'MOVE_BLOCK';
export const MOVE_CURSOR = 'MOVE_CURSOR';
export const RESIZE_BLOCK = 'RESIZE_BLOCK';
export const SET_BLOCK_STATE = 'SET_BLOCK_STATE';
export const SHOW_NEW_BLOCK_PROMPT = 'SHOW_NEW_BLOCK_PROMPT';
export const UPSERT_BLOCK = 'UPSERT_BLOCK';
export const UPDATE_CONTENT_SIZE = 'UPDATE_CONTENT_SIZE';
export const SAVE_GRAPH_TO_DB_DONE = 'SAVE_GRAPH_TO_DB_DONE';
export const READ_GRAPH_FROM_DB_DONE = 'READ_GRAPH_FROM_DB_DONE';
export const SHOW_HELP = 'SHOW_HELP';
export const HIDE_HELP = 'HIDE_HELP';
export const TOGGLE_HELP = 'TOGGLE_HELP';

export const DEFAULT_BLOCK_SPEC = `
{
  // block is an object...

  // ...with name - will appear in new block dropdown
  name: 'sample block',

  // ...has some inputs
  inputs: [ 'a', 'b', 'c' ],

  // ...and outputs
  outputs: [ 'x', 'y', 'z' ],

  // code - runs the block
  // * inputs - object of \`rx.Subject\`: \`{ [inputKey]: Subject() }\` - changes on input
  // * outputs - object of \`rx.Subject\`: \`{ [inputKey]: Subject() }\` - send changes over output
  // * state - internal \`rx.Subject\` - changes when setState is used
  // * setState - used to change the \`state\` - communicates \`code\` with \`ui\`
  code: ({ inputs, outputs, state, setState }) => {
    inputs.a.subscribe(a => {
      console.log('a:' + a);

      outputs.x.onNext('new a:' + a);
    });

    state.subscribe(stateValue => {
      console.log('new state', stateValue)

      outputs.z.onNext('new click date:' + stateValue.clickedAt);
    });

    setInterval(() => {
      setState({ date: new Date().getTime() });
    }, 1000);
  },

  // cleanup - optional function run when the block is removed from board
  cleanup: () => {
    // clean up things like setInterval/setTimeout, etc...
  },

  // ui - optional React ui for block
  // * state - current state as plain object
  // * setState - same as in code, used to communicate
  // ui has access to \`DOM\` which is \`require('react-dom-factories')\`
  ui: ({ state, setState }) => {
    return DOM.div(
      { onClick: () => setState({ clickedAt: new Date().getTime() }) },
      "date",
      state.date
    );
  }
}`;
