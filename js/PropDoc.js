'use strict';

import React from 'react';

export default class PropDoc extends React.Component {
  render() {
    return (
      <div className="form-group">
        <label>{this.props.name}</label>
        <div className="code-group">
          <code>
            {this.props.type}
            {this._renderOptional()}
          </code>
          {this._renderDefault()}
        </div>
        <p>
          {this.props.children}
        </p>
      </div>
    );
  }
  _renderOptional() {
    if (this.props.optional) {
      return <span className="attribute"> optional</span>;
    }
  }
  _renderDefault() {
    if (this.props.defaultVal) {
      const innerHTML = { __html: this.props.defaultVal };

      return (
        <div>
          <br />
          <code>default: <pre dangerouslySetInnerHTML={innerHTML} /></code>
        </div>
      );
    }
  }
}

PropDoc.propTypes = {
  name: React.PropTypes.string.isRequired,
  type: React.PropTypes.string.isRequired,
  children: React.PropTypes.node.isRequired,
  optional: React.PropTypes.bool,
  defaultVal: React.PropTypes.string
};
