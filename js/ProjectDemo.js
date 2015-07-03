'use strict';

import React from 'react';
import MaskedField from 'react-masked-field';

export default React.createClass({
  getInitialState() {
    return { dateStr: null };
  },
  render() {
    return (
      <div>
        <h4>Demo</h4>
        <p>The example below will only allow a numeric entry for dates.</p>
        <form>
          <div className="form-group">
            <label>Date</label>
            <MaskedField
              className="react-masked-field-demo"
              mask="99/99/9999"
              onChange={this._handleDateChange}
              onComplete={this._handleDateFilled}
            />
            {this._renderDateDisplay()}
          </div>
        </form>
      </div>
    );
  },
  _renderDateDisplay() {
    return this.state.dateStr ? <span>Date filled: {this.state.dateStr}</span> : null;
  },
  _handleDateChange() {
    this.setState({dateStr: null});
  },
  _handleDateFilled(value) {
    this.setState({dateStr: value});
  }
});
