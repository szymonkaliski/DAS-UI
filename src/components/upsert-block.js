import Ace from 'react-ace';
import autobind from 'react-autobind';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import 'brace/mode/javascript';
import 'brace/theme/github';

import { upsertBlock } from '../actions';

const DEFAULT_BLOCK = `
{
  name: 'sample block',

  inputs: [ 'a', 'b', 'c' ],
  outputs: [ 'x', 'y', 'z' ],

  code: ({ inputs, outputs, state }) => {
  },

  ui: () => {
    return DOM.div(null, "sample block");
  }
}`;

class UpsertBlock extends Component {
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
    /* eslint-disable no-new-func */
    const executeBlockSrc = blockSrc => new Function(`return ${blockSrc.trim()}`)();
    /* eslint-enable no-new-func */

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
      <div className="upsert-block">
        <div>
          <button onClick={this.onSave}>save</button>
        </div>
        <Ace
          ref={ref => (this.aceRef = ref)}
          width="100%"
          height="100%"
          fontSize={12}
          mode="javascript"
          name="create_block_ace"
          theme="github"
          showGutter={false}
          showPrintMargin={false}
          showLineNumbers={false}
          onChange={text => this.setState({ block: text })}
          value={this.state.block}
          editorProps={{ $blockScrolling: true }}
        />
      </div>
    );
  }
}

export default connect(null, { upsertBlock })(UpsertBlock);
