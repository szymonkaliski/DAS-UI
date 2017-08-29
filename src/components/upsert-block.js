import Ace from 'react-ace';
import autobind from 'react-autobind';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import ace from 'brace';

import 'brace/mode/javascript';
import 'brace/theme/github';
import 'brace/keybinding/vim';

import { upsertBlock, cancelUpsertBlock } from '../actions';
import { executeBlockSrc } from '../utils';

const EMPTY_BLOCK = `
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

class UpsertBlock extends Component {
  constructor() {
    super();
    autobind(this);

    this.state = {
      block: EMPTY_BLOCK
    };
  }

  componentDidMount() {
    // focus with short timeout so we don't populate the field with just clicked letter
    setTimeout(() => this.aceRef.editor.focus(), 1);

    ace.config.loadModule('ace/keyboard/vim', ({ Vim }) => {
      Vim.defineEx('write', 'w', () => {
        this.onSave();
      });

      Vim.defineEx('quit', 'q', () => {
        this.props.cancelUpsertBlock();
      });
    });
  }

  onSave() {
    try {
      const block = executeBlockSrc(this.state.block);

      this.props.upsertBlock(block);
    } catch (e) {
      // TODO: show error
      console.error(e);
    }
  }

  render() {
    return (
      <div className="upsert-block">
        <Ace
          editorProps={{ $blockScrolling: true }}
          height="100%"
          keyboardHandler="vim"
          mode="javascript"
          name="create_block_ace"
          onChange={text => this.setState({ block: text })}
          ref={ref => (this.aceRef = ref)}
          showGutter={false}
          showLineNumbers={false}
          showPrintMargin={false}
          theme="github"
          value={this.state.block}
          width="100%"
        />
      </div>
    );
  }
}

export default connect(null, { upsertBlock, cancelUpsertBlock })(UpsertBlock);
