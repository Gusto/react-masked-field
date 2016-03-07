'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
/**
* Copyright (c) 2015 ZenPayroll
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _SelectionUtils = require('./SelectionUtils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_TRANSLATIONS = {
  '9': /\d/,
  'a': /[A-Za-z]/,
  '*': /[A-Za-z0-9]/
};

var BLANK_CHAR = '_';

var MaskedField = _react2.default.createClass({
  displayName: 'MaskedField',

  propTypes: {
    mask: _react2.default.PropTypes.string,
    translations: _react2.default.PropTypes.object,
    value: _react2.default.PropTypes.string,
    placeholder: _react2.default.PropTypes.string,
    onChange: _react2.default.PropTypes.func,
    onKeyDown: _react2.default.PropTypes.func,
    onComplete: _react2.default.PropTypes.func,
    onFocus: _react2.default.PropTypes.func,
    onBlur: _react2.default.PropTypes.func,
    valueLink: _react2.default.PropTypes.object
  },
  getInitialState: function getInitialState() {
    if (!this.props.mask) {
      return null;
    }

    this._buffer = this._initialBuffer();
    this._cursorPos = this._firstNonMaskIdx;

    var propsValue = this._getPropsValue();
    return {
      // TODO: Any way we can do this in one pass?
      value: propsValue ? this._maskedValue(propsValue) : ''
    };
  },
  componentDidUpdate: function componentDidUpdate() {
    if (this._cursorPos !== undefined) {
      this._setSelection(this._cursorPos);
    }
  },
  componentDidMount: function componentDidMount() {
    this._isMounted = true;
    var propsValue = this._getPropsValue();
    if (this.props.mask && typeof propsValue === 'string' && this.state.value !== propsValue) {
      this._callOnChange(this.state.value);
    }
  },
  componentWillUnmount: function componentWillUnmount() {
    this._isMounted = false;
  },
  render: function render() {
    var props = {};
    if (this.props.mask) {
      props = {
        onChange: this._handleChange,
        onKeyDown: this._handleKeyDown,
        onFocus: this._handleFocus,
        onBlur: this._handleBlur,
        value: this.state.value,
        valueLink: null
      };

      if (!this.props.placeholder) {
        props.placeholder = this._initialBuffer().join('');
      }
    }

    return _react2.default.createElement('input', _extends({}, this.props, props, { type: 'text' }));
  },
  _getSelection: function _getSelection() {
    if (this._isMounted) {
      return (0, _SelectionUtils.getSelection)(_react2.default.findDOMNode(this));
    } else {
      var cursorPos = (this._getPropsValue() || '').length;
      return { start: cursorPos, end: cursorPos };
    }
  },
  _setSelection: function _setSelection(start) {
    var end = arguments.length <= 1 || arguments[1] === undefined ? start : arguments[1];

    var domNode = _react2.default.findDOMNode(this);
    if (domNode === document.activeElement) {
      (0, _SelectionUtils.setSelection)(domNode, start, end);
    }
  },
  _getPropsValue: function _getPropsValue() {
    if (this.props.valueLink) {
      return this.props.valueLink.value;
    } else {
      return this.props.value;
    }
  },
  _getPattern: function _getPattern(idx) {
    var maskChar = this.props.mask[idx];
    var pattern = this.props.translations ? this.props.translations[maskChar] : null;

    return pattern || DEFAULT_TRANSLATIONS[maskChar];
  },
  _resetBuffer: function _resetBuffer(start, end) {
    for (var i = start; i < end; ++i) {
      if (this._getPattern(i)) {
        this._buffer[i] = BLANK_CHAR;
      }
    }
  },
  _initialBuffer: function _initialBuffer() {
    var buffer = [];
    for (var idx = 0; idx < this.props.mask.length; ++idx) {
      if (this._getPattern(idx)) {
        if (this._firstNonMaskIdx === undefined) {
          this._firstNonMaskIdx = idx;
        }
        buffer.push('_');
      } else {
        buffer.push(this.props.mask[idx]);
      }
    }

    return buffer;
  },
  _isBufferEmpty: function _isBufferEmpty() {
    var _this = this;

    return this._buffer.every(function (char, idx) {
      return !_this._getPattern(idx) || char === BLANK_CHAR;
    });
  },
  _isBufferFull: function _isBufferFull() {
    var _this2 = this;

    return this._buffer.every(function (char, idx) {
      return !_this2._getPattern(idx) || char !== BLANK_CHAR;
    });
  },
  _nextNonMaskIdx: function _nextNonMaskIdx(idx) {
    var next = idx + 1;
    for (; next < this.props.mask.length; ++next) {
      if (this._getPattern(next)) {
        break;
      }
    }

    return next;
  },
  _prevNonMaskIdx: function _prevNonMaskIdx(idx) {
    var prev = idx - 1;
    for (; prev >= 0; --prev) {
      if (this._getPattern(prev)) {
        break;
      }
    }

    return prev;
  },
  _callOnChange: function _callOnChange(value) {
    if (this.props.valueLink) {
      this.props.valueLink.requestChange(value);
    } else if (this.props.onChange) {
      this.props.onChange({ target: { value: value } });
    }
  },
  _callOnComplete: function _callOnComplete(value) {
    if (this.props.onComplete && this._isBufferFull()) {
      this.props.onComplete(value);
    }
  },
  _setValue: function _setValue(value) {
    if (value !== this.state.value) {
      this._callOnChange(value);
    }
    this.setState({ value: value });
  },
  _handleFocus: function _handleFocus(e) {
    var _this3 = this;

    setTimeout(function () {
      return _this3._setSelection(_this3._cursorPos);
    }, 0);

    if (this.props.onFocus) {
      this.props.onFocus(e);
    }

    this.setState({ value: this._buffer.join('') });
  },
  _handleBlur: function _handleBlur(e) {
    if (this._isBufferEmpty()) {
      this._setValue('');
    }

    if (this.props.onBlur) {
      this.props.onBlur(e);
    }
  },
  _handleKeyDown: function _handleKeyDown(e) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      var _getSelection2 = this._getSelection();

      var start = _getSelection2.start;
      var end = _getSelection2.end;


      if (start === end) {
        start = e.key === 'Delete' ? this._nextNonMaskIdx(start - 1) : this._prevNonMaskIdx(start);
        end = this._nextNonMaskIdx(start);
      }

      var value = void 0;
      var pattern = this._getPattern(start);
      if (pattern && pattern.test(this._buffer[end])) {
        value = this._maskedValue(this.state.value.substring(end), start);
      } else {
        this._resetBuffer(start, end);
        value = this._buffer.join('');
      }

      this._setValue(value);
      this._cursorPos = Math.max(start, this._firstNonMaskIdx);

      e.preventDefault();
    }

    if (this.props.onKeyDown) {
      this.props.onKeyDown(e);
    }
  },
  _handleChange: function _handleChange(e) {
    var value = this._maskedValue(e.target.value);
    this._setValue(value);
    this._callOnComplete(value);
  },
  _maskedValue: function _maskedValue(value) {
    var start = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

    var originalCursorPos = this._cursorPos = this._getSelection().start;
    for (var bufferIdx = start, valueIdx = 0; bufferIdx < this.props.mask.length; ++bufferIdx) {
      var pattern = this._getPattern(bufferIdx);
      if (pattern) {
        var lastPatternIdx = bufferIdx;
        this._buffer[bufferIdx] = BLANK_CHAR;
        while (valueIdx < value.length && bufferIdx < this.props.mask.length) {
          var c = value[valueIdx++];
          if (c === this._buffer[bufferIdx]) {
            bufferIdx++;
          } else if (pattern.test(c)) {
            this._buffer[bufferIdx] = c;
            break;
          } else if (this._cursorPos > lastPatternIdx) {
            this._cursorPos--;
          }
        }

        if (valueIdx >= value.length) {
          this._resetBuffer(lastPatternIdx + 1, this.props.mask.length);
          break;
        }
      } else {
        if (this._buffer[bufferIdx] === value[valueIdx]) {
          if (valueIdx === originalCursorPos) {
            this._cursorPos++;
          }

          valueIdx++;
        } else if (valueIdx <= originalCursorPos) {
          this._cursorPos++;
        }
      }
    }

    return this._buffer.join('');
  }
});

module.exports = MaskedField;