import Ace from 'react-ace';
import autobind from 'react-autobind';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import ace from 'brace';

import 'brace/mode/javascript';
import 'brace/theme/github';
import 'brace/keybinding/vim';

import { NEW_BLOCK_NAME, DEFAULT_BLOCK_SPEC } from '../constants';
import { executeBlockSrc } from '../utils';
import { upsertBlock, cancelUpsertBlock } from '../actions';

class UpsertBlock extends Component {
  constructor(props) {
    super(props);
    autobind(this);

    this.state = {
      blockSpec: props.blockSpec
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
      // this will throw on error
      const block = executeBlockSrc(this.state.blockSpec);

      if (!!block) {
        this.props.upsertBlock(this.state.blockSpec);
      }
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
          onChange={text => this.setState({ blockSpec: text })}
          ref={ref => (this.aceRef = ref)}
          showGutter={false}
          showLineNumbers={false}
          showPrintMargin={false}
          theme="github"
          value={this.state.blockSpec}
          width="100%"
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  const upsertBlockOverlayValue = state.getIn(['ui', 'upsertBlockOverlay']);

  return {
    blockSpec: upsertBlockOverlayValue === NEW_BLOCK_NAME ? DEFAULT_BLOCK_SPEC : upsertBlockOverlayValue
  };
};

export default connect(mapStateToProps, { upsertBlock, cancelUpsertBlock })(UpsertBlock);
