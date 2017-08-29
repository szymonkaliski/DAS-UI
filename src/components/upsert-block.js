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

const DEFAULT_BLOCK = `
{
  name: 'sample block',

  inputs: [ 'a', 'b', 'c' ],
  outputs: [ 'x', 'y', 'z' ],

  code: ({ inputs, outputs, state }) => {
  },

  ui: ({ state, setState }) => {
    return DOM.div(null, "sample block");
  }
}`;

class UpsertBlock extends Component {
  constructor() {
    super();
    autobind(this);

    this.state = {
      // TODO: edit existing block!
      block: DEFAULT_BLOCK
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
