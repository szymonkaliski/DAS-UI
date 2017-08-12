import Autocomplete from 'react-autocomplete';
import React, { Component } from 'react';
import autobind from 'react-autobind';
import classnames from 'classnames';
import { connect } from 'react-redux';

import { NEW_BLOCK_NAME } from '../constants';
import { openCreateBlock } from '../actions';

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

  onSelect(e) {
    // TODO: place block on board if exists, otherwise open create dialog - this logic should be in action/reducer
    this.props.openCreateBlock({ block: e });
  }

  render() {
    const { value } = this.state;
    const { blocks, x, y } = this.props;

    return (
      <div className="new-block" style={{ top: x, left: y }}>
        <Autocomplete
          ref={ref => (this.autocompleteRef = ref)}
          getItemValue={block => block.id}
          items={[{ name: 'New Block...', id: NEW_BLOCK_NAME }].concat(blocks)}
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
    blocks: state.get('blocks').valueSeq().toJS().map(block => ({ ...block, id: block.name }))
  };
};

export default connect(mapStateToProps, { openCreateBlock })(NewBlock);
