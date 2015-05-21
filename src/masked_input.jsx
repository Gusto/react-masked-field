'use strict';

var React = (typeof window !== 'undefined' && window !== null ? window.React : false) || require('react');

var MaskedInput = React.createClass({
  propTypes: {
    mask: React.PropTypes.string,
    format: React.PropTypes.string,
    onChange: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onKeyPress: React.PropTypes.func,
    onComplete: React.PropTypes.func
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
      var char = this.props.mask[idx];
      if (this._getPattern(idx)) {
        if (this._firstNonMaskIdx == null) {
          this._firstNonMaskIdx = idx;
        }

        char = this._getFormatChar(idx);
      }

      this._buffer.push(char);
    }

    this._cursorPos = this._firstNonMaskIdx;
    return {value: this._buffer.join('')};
  },
  componentDidUpdate: function() {
    if (this._cursorPos != null) {
      this._setSelection(this._cursorPos);
    }
  },
  render: function() {
    var props = {};

    if (this.props.mask != null) {
      props.onChange = this._handleChange;
      props.onKeyPress = this._handleKeyPress;
      props.onKeyDown = this._handleKeyDown;
      props.onFocus = this._handleFocus;
      props.value = (this.props.value != null) && this.props.value !== this.state.value ? this._maskedValue(this.props.value) : this.state.value;
    }

    return <input {...this.props} {...props} />;
  },
  _translations: {
    '9': /\d/,
    'a': /[A-Za-z]/,
    '*': /[A-Za-z0-9]/
  },
  _getSelection: function() {
    var node = this.getDOMNode();
    if (node.setSelectionRange != null) {
      return {
        begin: node.selectionStart,
        end: node.selectionEnd
      };
    }
    else {
      var range = document.selection.createRange();
      return {
        begin: 0 - range.duplicate().moveStart('character', -100000),
        end: begin + range.text.length
      };
    }
  },
  _setSelection: function(begin, end) {
    if (end == null) {
      end = begin;
    }

    var node = this.getDOMNode();
    if (node.setSelectionRange != null) {
      return node.setSelectionRange(begin, end);
    }
    else {
      var range = node.createTextRange();
      range.collapse(true);
      range.moveEnd('character', begin);
      range.moveStart('character', end);
      return range.select();
    }
  },
  _getPattern: function(idx) {
    return this._translations[this.props.mask[idx]];
  },
  _getFormatChar: function(idx) {
    idx = idx < this.props.format.length ? idx : 0;
    return this.props.format[idx];
  },
  _resetBuffer: function(start, end) {
    var i, _i;
    for (i = _i = start; start <= end ? _i < end : _i > end; i = start <= end ? ++_i : --_i) {
      if (this._getPattern(i) != null) {
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
    while (--pos >= 0 && (this._getPattern(pos) == null)) {
      true;
    }
    return pos;
  },
  _shiftLeft: function(begin, end) {
    var i, next, pattern, _i, _ref;
    this._resetBuffer(begin, end);
    if (begin < 0) {
      return;
    }
    next = this._seekNext(end - 1);
    for (i = _i = begin, _ref = this.props.mask.length; begin <= _ref ? _i < _ref : _i > _ref; i = begin <= _ref ? ++_i : --_i) {
      pattern = this._getPattern(i);
      if (pattern != null) {
        if (next < this.props.mask.length && pattern.test(this._buffer[next])) {
          this._buffer[i] = this._buffer[next];
          this._buffer[next] = this._getFormatChar(next);
        } else {
          break;
        }
        next = this._seekNext(next);
      }
    }
    return this._cursorPos = Math.max(begin, this._firstNonMaskIdx);
  },
  _shiftRight: function(pos) {
    var c, i, next, pattern, t, _i, _ref;
    c = this._getFormatChar(pos);
    for (i = _i = pos, _ref = this.props.mask.length; pos <= _ref ? _i < _ref : _i > _ref; i = pos <= _ref ? ++_i : --_i) {
      pattern = this._getPattern(i);
      if (pattern != null) {
        next = this._seekNext(i);
        t = this._buffer[i];
        this._buffer[i] = c;
        if (next < this.props.mask.length && pattern.test(t)) {
          c = t;
        } else {
          break;
        }
      }
    }
    return true;
  },
  _callOnComplete: function(value) {
    var i, _i, _ref;
    if (this.props.onComplete == null) {
      return;
    }
    for (i = _i = 0, _ref = this.props.mask.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      if ((this._getPattern(i) != null) && this._buffer[i] === this._getFormatChar(i)) {
        return;
      }
    }
    return this.props.onComplete(value);
  },
  _setValue: function(value) {
    var _base;
    if (typeof (_base = this.props).onChange === "function") {
      _base.onChange({
        target: {
          value: value
        }
      });
    }
    this.setState({
      value: value
    });
    return value;
  },
  _handleFocus: function(e) {
    setTimeout(function() {
      this._setSelection(this._cursorPos);
    }.bind(this), 0);

    var _base;
    return typeof (_base = this.props).onFocus === "function" ? _base.onFocus(e) : void 0;
  },
  _handleKeyDown: function(e) {
    var begin, end, _base, _ref;
    if (e.key === 'Backspace' || e.key === 'Delete') {
      _ref = this._getSelection(), begin = _ref.begin, end = _ref.end;
      if (begin === end) {
        if (e.key === 'Delete') {
          begin = this._seekNext(begin - 1);
          end = this._seekNext(begin);
        } else {
          begin = this._seekPrev(begin);
        }
      }
      this._shiftLeft(begin, end);
      this._setValue(this._buffer.join(''));
      e.preventDefault();
    }
    return typeof (_base = this.props).onKeyDown === "function" ? _base.onKeyDown(e) : void 0;
  },
  _handleKeyPress: function(e) {
    var begin, bufferChanged, end, next, value, _base, _ref;
    if (e.key.length === 1) {
      _ref = this._getSelection(), begin = _ref.begin, end = _ref.end;
      this._cursorPos = begin;
      bufferChanged = false;
      if (begin !== end) {
        this._shiftLeft(begin, end);
        bufferChanged = true;
      }
      next = this._seekNext(this._cursorPos - 1);
      if (next < this.props.mask.length && this._getPattern(next).test(e.key)) {
        this._shiftRight(next);
        this._buffer[next] = e.key;
        this._cursorPos = this._seekNext(next);
        value = this._setValue(this._buffer.join(''));
        this._callOnComplete(value);
      } else if (bufferChanged) {
        this._setValue(this._buffer.join(''));
      }
      e.preventDefault();
    }
    return typeof (_base = this.props).onKeyPress === "function" ? _base.onKeyPress(e) : void 0;
  },
  _handleChange: function(e) {
    var value = this._maskedValue(e.target.value);
    this._setValue(value);
    this._callOnComplete(value);
  },
  _maskedValue: function(input) {
    var c, i, pattern, pos, _i, _ref;
    pos = 0;
    for (i = _i = 0, _ref = this.props.mask.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      pattern = this._getPattern(i);
      if (pattern != null) {
        this._buffer[i] = this._getFormatChar(i);
        while (pos++ < input.length) {
          c = input[pos - 1];
          if (pattern.test(c)) {
            this._buffer[i] = c;
            break;
          }
        }
        if (pos > input.length) {
          this._resetBuffer(i + 1, this.props.mask.length);
          break;
        }
      } else if (this._buffer[i] === input[pos]) {
        pos++;
      }
    }
    this._cursorPos = i;

    return this._buffer.join('');
  }
});

module.exports = MaskedInput;
