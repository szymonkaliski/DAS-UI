import { fromJS } from 'immutable';
import uuid from 'uuid/v4';

import { MOVE_CURSOR, CREATE_BLOCK, UPSERT_BLOCK, NEW_BLOCK_NAME } from '../constants';

const initialState = fromJS({
  cursor: {
    x: 0,
    y: 0
  },
  availableBlocks: {},
  graph: {
    blocks: {},
    connections: {}
  },
  overlays: {
    createBlock: false
  }
});

export default (state = initialState, action) => {
  const { type, payload } = action;

  if (type === MOVE_CURSOR) {
    state = state.update('cursor', cursor => cursor.update('x', x => x + payload.x).update('y', y => y + payload.y));
  }

  if (type === UPSERT_BLOCK) {
    const { block } = payload;

    // TODO: place on board if creating new one...

    state = state.setIn(['availableBlocks', block.name], block).setIn(['overlays', 'createBlock'], false);
  }

  if (type === CREATE_BLOCK) {
    const { block } = payload;

    if (block === NEW_BLOCK_NAME) {
      // open overlay if creating brand new block
      state = state.setIn(['overlays', 'createBlock'], block);
    } else if (state.hasIn(['availableBlocks', block])) {
      // create on graph if using one of available blocks
      const id = uuid();

      state = state.setIn(
        ['graph', 'blocks', id],
        fromJS({
          id,
          block,
          position: state.get('cursor').toJS()
        })
      );
    }
  }

  console.info(action, state.toJS());

  return state;
};
