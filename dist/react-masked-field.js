/**
* react-masked-field 0.1.3
*/
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.MaskedField = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
* Copyright (c) 2015 ZenPayroll
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = (window ? window.React : null) || require('react');

var _require = require('./SelectionUtils');

var getSelection = _require.getSelection;
var setSelection = _require.setSelection;

var DEFAULT_TRANSLATIONS = {
  '9': /\d/,
  'a': /[A-Za-z]/,
  '*': /[A-Za-z0-9]/
};

var BLANK_CHAR = '_';

var MaskedField = React.createClass({
  displayName: 'MaskedField',

  propTypes: {
    mask: React.PropTypes.string,
    translations: React.PropTypes.object,
    value: React.PropTypes.string,
    placeholder: React.PropTypes.string,
    onChange: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onComplete: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    onBlur: React.PropTypes.func,
    valueLink: React.PropTypes.object
  },
  getInitialState: function getInitialState() {
    if (this.props.mask == null) {
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
    if (this._cursorPos != null) {
      this._setSelection(this._cursorPos);
    }
  },
  componentDidMount: function componentDidMount() {
    var propsValue = this._getPropsValue();
    if (this.props.mask != null && propsValue != null && this.state.value !== propsValue) {
      this._callOnChange(this.state.value);
    }
  },
  render: function render() {
    var props = {};
    if (this.props.mask != null) {
      props = {
        onChange: this._handleChange,
        onKeyDown: this._handleKeyDown,
        onFocus: this._handleFocus,
        onBlur: this._handleBlur,
        value: this.state.value,
        valueLink: null
      };

      if (this.props.placeholder == null) {
        props.placeholder = this._initialBuffer().join('');
      }
    }

    return React.createElement('input', _extends({}, this.props, props, { type: "text" }));
  },
  _getSelection: function _getSelection() {
    if (this.isMounted()) {
      return getSelection(this.getDOMNode());
    } else {
      var cursorPos = (this._getPropsValue() || '').length;
      return { start: cursorPos, end: cursorPos };
    }
  },
  _setSelection: function _setSelection(start) {
    var end = arguments.length <= 1 || arguments[1] === undefined ? start : arguments[1];
    return (function () {
      setSelection(this.getDOMNode(), start, end);
    }).apply(this, arguments);
  },
  _getPropsValue: function _getPropsValue() {
    if (this.props.valueLink != null) {
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
        if (this._firstNonMaskIdx == null) {
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
    if (this.props.valueLink != null) {
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

      var value = undefined;
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

},{"./SelectionUtils":2,"react":"react"}],2:[function(require,module,exports){
'use strict';

module.exports = {
  getSelection: function getSelection(node) {
    var start = undefined,
        end = undefined;
    if (node.setSelectionRange != null) {
      start = node.selectionStart;
      end = node.selectionEnd;
    } else {
      var range = document.selection.createRange();
      start = 0 - range.duplicate().moveStart('character', -100000);
      end = start + range.text.length;
    }

    return { start: start, end: end };
  },
  setSelection: function setSelection(node, start, end) {
    if (node.setSelectionRange != null) {
      node.setSelectionRange(start, end);
    } else {
      var range = node.createTextRange();
      range.collapse(true);
      range.moveEnd('character', start);
      range.moveStart('character', end);
      range.select();
    }
  }
};

},{}]},{},[1])(1)
});