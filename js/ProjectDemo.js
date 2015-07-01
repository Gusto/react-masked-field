'use strict';

import React from 'react';
import MaskedField from 'react-masked-field';

export default React.createClass({
  // getInitialState() {
  //   return { dateComplete: fa}
  // }

  render() {
    return (
      <div>
        <h4>Demo</h4>
        <p>The example below will only allow a numeric entry for dates.</p>
        <form>
          <div className="form-group">
            <label>Date</label>
            <MaskedField className="react-masked-field-demo" mask="99/99/9999" />
          </div>
        </form>
      </div>
    );
  }
});
