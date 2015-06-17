'use strict';

const React = (window ? window.React : null) || require('react');

module.exports = function (props, propName, componentName) {
  let result = React.PropTypes.string.apply(null, arguments);

  if (result === null && props.mask != null && props.format != null &&
      props.format.length !== 1 && props.format.length !== props.mask.length) {
    let msg = 'Invalid prop `' + propName + '` supplied to `' + componentName +
      '`, length must be 1 or match the length of prop `mask`.';
    result = new Error(msg);
  }

  return result;
};
