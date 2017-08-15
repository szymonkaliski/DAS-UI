import Autocomplete from 'react-autocomplete';
import React, { Component } from 'react';
import autobind from 'react-autobind';
import classnames from 'classnames';
import { connect } from 'react-redux';

import { NEW_BLOCK_NAME } from '../constants';
import { createBlock } from '../actions';

// has to be a class - required by react-autocomplete
class NewBlockItem extends Component {
  render() {
    const { item, isHighlighted } = this.props;

    return (
      <div className={classnames('new-block__item', isHighlighted && 'new-block__item--selected')}>
        {item.name}
      </div>
    );
  }
}

class NewBlock extends Component {
  constructor() {
    super();
    autobind(this);

    this.state = { value: '' };
  }

  componentDidMount() {
    // focus with short timeout so we don't populate the field with just clicked letter
    setTimeout(() => this.autocompleteRef.focus(), 1);
  }

  onChange(e) {
    this.setState({ value: e.target.value });
  }

  onSelect(blockName) {
    this.props.createBlock(blockName);
  }

  render() {
    const { value } = this.state;
    const { blockSpecs, x, y } = this.props;

    return (
      <div className="new-block" style={{ top: y, left: x }}>
        <Autocomplete
          ref={ref => (this.autocompleteRef = ref)}
          getItemValue={block => block.id}
          items={[{ name: 'New Block...', id: NEW_BLOCK_NAME }].concat(blockSpecs)}
          onChange={this.onChange}
          onSelect={this.onSelect}
          renderItem={(item, isHighlighted) => <NewBlockItem item={item} isHighlighted={isHighlighted} />}
          value={value}
        />
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    blockSpecs: state.get('blockSpecs').valueSeq().toJS().map(block => ({ ...block, id: block.name }))
  };
};

export default connect(mapStateToProps, { createBlock })(NewBlock);
