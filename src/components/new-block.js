import Ace from 'react-ace';
import autobind from 'react-autobind';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import 'brace/mode/javascript';
import 'brace/theme/github';

import Overlay from './overlay';

import { upsertBlock } from '../actions';

const DEFAULT_BLOCK = `
{
  name: 'sample block',

  input: { x: '' },
  output: { y: '' },
  state: { internal: '' },

  // "code" is executed every time input or state changes
  code: ({ input, state, updateState, updateOutput }) => {
    // block code

    updateOutput({ // must conform to "output"
      y: state.internal + input.x
    });
  },

  // optional UI to be rendered inside of the block
  ui: ({ input, state, updateState, updateOutput }) => {
    return DOM.input({
      onChange: e => updateState({ internal: e.target.value })
    })
  }
}`;

class NewBlock extends Component {
  constructor() {
    super();
    autobind(this);

    this.state = {
      block: DEFAULT_BLOCK
    };
  }

  componentDidMount() {
    // focus with short timeout so we don't populate the field with just clicked letter
    setTimeout(() => this.aceRef.editor.focus(), 1);
  }

  onSave() {
    const executeBlockSrc = blockSrc => new Function(`return ${blockSrc.trim()}`)();

    try {
      const block = executeBlockSrc(this.state.block);

      console.log({ block });

      this.props.upsertBlock(block);
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    return (
      <div className="new_block">
        <Overlay>
          <div>
            <button onClick={this.onSave}>save</button>
          </div>
          <Ace
            ref={ref => (this.aceRef = ref)}
            width="100%"
            height="100%"
            fontSize={12}
            mode="javascript"
            name="new_block_ace"
            theme="github"
            showGutter={false}
            showPrintMargin={false}
            showLineNumbers={false}
            onChange={text => this.setState({ block: text })}
            value={this.state.block}
            editorProps={{ $blockScrolling: true }}
          />
        </Overlay>
      </div>
    );
  }
}

export default connect(null, { upsertBlock })(NewBlock);
