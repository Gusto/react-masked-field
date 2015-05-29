'use strict';

var React = (window ? window.React : null) || require('react');
var {getSelection, setSelection} = require('./SelectionUtils');

var DEFAULT_TRANSLATIONS = {
  '9': /\d/,
  'a': /[A-Za-z]/,
  '*': /[A-Za-z0-9]/
};

var MaskedInput = React.createClass({
  // TODO: format validation
  propTypes: {
    mask: React.PropTypes.string,
    format: React.PropTypes.string,
    translations: React.PropTypes.object,
    onChange: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onKeyPress: React.PropTypes.func,
    onComplete: React.PropTypes.func,
    onFocus: React.PropTypes.func,
    valueLink: React.PropTypes.object
  },
  getDefaultProps: function() {
    return {format: '_'};
  },
  getInitialState: function() {
    if (this.props.mask == null) {
      return null;
    }

    this._buffer = [];
    for (var idx = 0; idx < this.props.mask.length; ++idx) {
      if (this._getPattern(idx)) {
        if (this._firstNonMaskIdx == null) {
          this._firstNonMaskIdx = idx;
        }
        this._buffer.push(this._getFormatChar(idx));
      }
      else {
        this._buffer.push(this.props.mask[idx]);
      }
    }

    this._cursorPos = this._firstNonMaskIdx;
    return {
      // TODO: Any way we can do this in one pass?
      value: this._maskedValue(this._getPropsValue() || '')
    };
  },
  componentDidUpdate: function() {
    if (this._cursorPos != null) {
      this._setSelection(this._cursorPos);
    }
  },
  componentDidMount: function() {
    var propsValue = this._getPropsValue();
    if (this.props.mask && propsValue != null && this.state.value !== propsValue) {
      this._callOnChange(this.state.value);
    }
  },
  render: function() {
    var props;
    if (this.props.mask != null) {
      props = {
        onChange: this._handleChange,
        onKeyDown: this._handleKeyDown,
        onFocus: this._handleFocus,
        value: this.state.value,
        valueLink: null
      };
    }
    else {
      props = {};
    }

    return <input {...this.props} {...props} />;
  },
  _getSelection: function() {
    if (this.isMounted()) {
      return getSelection(this.getDOMNode());
    }
    else {
      return {start: 0, end: 0};
    }
  },
  _setSelection: function(start, end) {
    if (end == null) {
      end = start;
    }
    setSelection(this.getDOMNode(), start, end);
  },
  _getPropsValue: function() {
    if (this.props.valueLink != null) {
      return this.props.valueLink.value;
    }
    else {
      return this.props.value;
    }
  },
  _getPattern: function(idx) {
    var maskChar = this.props.mask[idx];
    var pattern = this.props.translations ? this.props.translations[maskChar] : null;

    return pattern || DEFAULT_TRANSLATIONS[maskChar];
  },
  _getFormatChar: function(idx) {
    idx = idx < this.props.format.length ? idx : 0;
    return this.props.format[idx];
  },
  _resetBuffer: function(start, end) {
    for (var i = start; i < end; ++i) {
      if (this._getPattern(i)) {
        this._buffer[i] = this._getFormatChar(i);
      }
    }
  },
  _seekNext: function(pos) {
    while (++pos < this.props.mask.length && (this._getPattern(pos) == null)) {
      true;
    }
    return pos;
  },
  _seekPrev: function(pos) {
    // TODO: Not a big fan of this...
    while (--pos >= 0 && (this._getPattern(pos) == null)) {
      true;
    }
    return pos;
  },
  _callOnChange: function(value) {
    if (this.props.valueLink != null) {
      this.props.valueLink.requestChange(value);
    }
    else if (this.props.onChange) {
      this.props.onChange({target: {value: value}});
    }
  },
  _callOnComplete: function(value) {
    if (this.props.onComplete) {
      for (var i = 0; i < this.props.mask.length; ++i) {
        if (this._getPattern(i) && this._buffer[i] === this._getFormatChar(i)) {
          return;
        }
      }

      this.props.onComplete(value);
    }
  },
  _setValue: function(value) {
    if (value !== this.state.value) {
      this._callOnChange(value);
    }
    this.setState({value});
  },
  _handleFocus: function(e) {
    setTimeout(() => {
      this._setSelection(this._cursorPos);
    }, 0);

    if (this.props.onFocus) {
      this.props.onFocus(e);
    }
  },
  _handleKeyDown: function(e) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      var {start, end} = this._getSelection();

      if (start === end) {
        start = e.key === 'Delete' ? this._seekNext(start - 1) : this._seekPrev(start);
        end = this._seekNext(start);
      }

      var value;
      var pattern = this._getPattern(start);
      if (pattern && pattern.test(this._buffer[end])) {
        value = this._maskedValue(this.state.value.substring(end), start);
      }
      else {
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
  _handleChange: function(e) {
    var value = this._maskedValue(e.target.value);
    this._setValue(value);
    this._callOnComplete(value);
  },
  _maskedValue: function(value, start) {
    if (start == null) {
      start = 0;
    }

    var bufferPos = start;
    var valuePos = 0;
    for (; bufferPos < this.props.mask.length; ++bufferPos, ++valuePos) {
      if (this._buffer[bufferPos] !== value[valuePos]) {
        break;
      }
    }

    var originalCursorPos = this._cursorPos = this._getSelection().start;
    for (; bufferPos < this.props.mask.length; ++bufferPos)  {
      var pattern = this._getPattern(bufferPos);
      if (pattern != null) {
        this._buffer[bufferPos] = this._getFormatChar(bufferPos);
        while (valuePos < value.length) {
          var c = value[valuePos++];
          if (pattern.test(c)) {
            this._buffer[bufferPos] = c;
            break;
          }
          else if (this._cursorPos > bufferPos) {
            this._cursorPos--;
          }
        }

        if (valuePos >= value.length) {
          this._resetBuffer(bufferPos + 1, this.props.mask.length);
          break;
        }
      }
      else {
        if (valuePos <= originalCursorPos) {
          this._cursorPos++;
        }
        if (this._buffer[bufferPos] === value[valuePos]) {
          valuePos++;
        }
      }
    }

    return this._buffer.join('');
  }
});

module.exports = MaskedInput;
