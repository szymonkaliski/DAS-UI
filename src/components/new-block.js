import Autocomplete from 'react-autocomplete';
import React, { Component } from 'react';
import autobind from 'react-autobind';
import classnames from 'classnames';
import { connect } from 'react-redux';

import { NEW_BLOCK_NAME, GRID_SIZE } from '../constants';
import { createBlock, closeNewBlockPrompt } from '../actions';

const PADDING = 4;

// has to be a class - required by react-autocomplete
class NewBlockItem extends Component {
  render() {
    const { item, isHighlighted } = this.props;

    return (
      <div className={classnames('new-block__menu-item', isHighlighted && 'new-block__menu-item--selected')}>
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

  onKeyDown(e) {
    const { key } = e;

    if (key === 'Escape') {
      this.props.closeNewBlockPrompt();
    }
  }

  render() {
    const { value } = this.state;
    const { blockSpecs, x, y } = this.props;

    const menuItems = blockSpecs.filter(
      ({ name }) => (value.length >= 0 ? name.toLowerCase().indexOf(value.toLowerCase()) >= 0 : true)
    );

    return (
      <div
        className="new-block"
        style={{
          transform: `translate(${x}px, ${y}px)`,
          height: GRID_SIZE,
          width: 8 * GRID_SIZE
        }}
      >
        <Autocomplete
          ref={ref => (this.autocompleteRef = ref)}
          inputProps={{
            onKeyDown: this.onKeyDown,
            className: 'new-block__input',
            style: {
              height: GRID_SIZE - PADDING * 2,
              width: 8 * GRID_SIZE - PADDING * 2
            }
          }}
          getItemValue={block => block.id}
          items={[{ name: `create new${value.length > 0 ? `: ${value}` : '...'}`, id: NEW_BLOCK_NAME }].concat(
            menuItems
          )}
          onChange={this.onChange}
          onSelect={this.onSelect}
          renderItem={(item, isHighlighted) => (
            <NewBlockItem key={item.name} item={item} isHighlighted={isHighlighted} />
          )}
          renderMenu={(items, value, style) => (
            <div className="new-block__menu" style={style}>
              {items}
            </div>
          )}
          value={value}
          open
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  x: (state.getIn(['ui', 'cursor', 'x']) - state.getIn(['ui', 'grid', 'offsetX'])) * GRID_SIZE,
  y: (state.getIn(['ui', 'cursor', 'y']) - state.getIn(['ui', 'grid', 'offsetY'])) * GRID_SIZE,
  blockSpecs: state
    .get('blockSpecs')
    .valueSeq()
    .toJS()
    .map(block => ({ ...block, id: block.name }))
});

export default connect(mapStateToProps, { createBlock, closeNewBlockPrompt })(NewBlock);
