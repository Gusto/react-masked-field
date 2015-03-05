(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.MaskedInput = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var MaskedInput, React;

React = (typeof window !== "undefined" && window !== null ? window.React : void 0) || require('react');

MaskedInput = React.createClass({
  displayName: 'MaskedInput',
  propTypes: {
    mask: React.PropTypes.string,
    format: React.PropTypes.string,
    onChange: React.PropTypes.func,
    onKeyDown: React.PropTypes.func,
    onKeyPress: React.PropTypes.func,
    onComplete: React.PropTypes.func
  },
  getDefaultProps: function() {
    return {
      format: '_'
    };
  },
  getInitialState: function() {
    var char, idx;
    if (this.props.mask == null) {
      return null;
    }
    this.buffer = (function() {
      var _i, _len, _ref, _results;
      _ref = this.props.mask.split('');
      _results = [];
      for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
        char = _ref[idx];
        if (this.translations[char]) {
          if (this.firstNonMaskIdx == null) {
            this.firstNonMaskIdx = idx;
          }
          _results.push(this.getFormat(idx));
        } else {
          _results.push(char);
        }
      }
      return _results;
    }).call(this);
    this.cursorPos = this.firstNonMaskIdx;
    return {
      value: this.buffer.join('')
    };
  },
  componentDidUpdate: function() {
    if (this.cursorPos != null) {
      return this.setCursorPos(this.cursorPos);
    }
  },
  translations: {
    '9': /\d/,
    'a': /[A-Za-z]/,
    '*': /[A-Za-z0-9]/
  },
  getCursorPos: function() {
    var begin, end, node, range;
    node = this.getDOMNode();
    if (node.setSelectionRange != null) {
      begin = node.selectionStart;
      end = node.selectionEnd;
    } else {
      range = document.selection.createRange();
      begin = 0 - range.duplicate().moveStart('character', -100000);
      end = begin + range.text.length;
    }
    return {
      begin: begin,
      end: end
    };
  },
  setCursorPos: function(begin, end) {
    var node, range;
    if (end == null) {
      end = begin;
    }
    node = this.getDOMNode();
    if (node.setSelectionRange != null) {
      return node.setSelectionRange(begin, end);
    } else {
      range = node.createTextRange();
      range.collapse(true);
      range.moveEnd('character', begin);
      range.moveStart('character', end);
      return range.select();
    }
  },
  getPattern: function(idx) {
    return this.translations[this.props.mask[idx]];
  },
  getFormat: function(idx) {
    idx = idx < this.props.format.length ? idx : 0;
    return this.props.format[idx];
  },
  clearBuffer: function(start, end) {
    var i, _i;
    for (i = _i = start; start <= end ? _i < end : _i > end; i = start <= end ? ++_i : --_i) {
      if (this.getPattern(i) != null) {
        this.buffer[i] = this.getFormat(i);
      }
    }
    return true;
  },
  seekNext: function(pos) {
    while (++pos < this.props.mask.length && (this.getPattern(pos) == null)) {
      true;
    }
    return pos;
  },
  seekPrev: function(pos) {
    while (--pos >= 0 && (this.getPattern(pos) == null)) {
      true;
    }
    return pos;
  },
  shiftLeft: function(begin, end) {
    var i, next, pattern, _i, _ref;
    this.clearBuffer(begin, end);
    if (begin < 0) {
      return;
    }
    next = this.seekNext(end - 1);
    for (i = _i = begin, _ref = this.props.mask.length; begin <= _ref ? _i < _ref : _i > _ref; i = begin <= _ref ? ++_i : --_i) {
      pattern = this.getPattern(i);
      if (pattern != null) {
        if (next < this.props.mask.length && pattern.test(this.buffer[next])) {
          this.buffer[i] = this.buffer[next];
          this.buffer[next] = this.getFormat(next);
        } else {
          break;
        }
        next = this.seekNext(next);
      }
    }
    return this.cursorPos = Math.max(begin, this.firstNonMaskIdx);
  },
  shiftRight: function(pos) {
    var c, i, next, pattern, t, _i, _ref;
    c = this.getFormat(pos);
    for (i = _i = pos, _ref = this.props.mask.length; pos <= _ref ? _i < _ref : _i > _ref; i = pos <= _ref ? ++_i : --_i) {
      pattern = this.getPattern(i);
      if (pattern != null) {
        next = this.seekNext(i);
        t = this.buffer[i];
        this.buffer[i] = c;
        if (next < this.props.mask.length && pattern.test(t)) {
          c = t;
        } else {
          break;
        }
      }
    }
    return true;
  },
  fireOnComplete: function(value) {
    var i, _i, _ref;
    if (this.props.onComplete == null) {
      return;
    }
    for (i = _i = 0, _ref = this.props.mask.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      if ((this.getPattern(i) != null) && this.buffer[i] === this.getFormat(i)) {
        return;
      }
    }
    return this.props.onComplete(value);
  },
  setValue: function(value) {
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
  handleFocus: function(e) {
    var _base;
    setTimeout((function(_this) {
      return function() {
        return _this.setCursorPos(_this.cursorPos);
      };
    })(this), 0);
    return typeof (_base = this.props).onFocus === "function" ? _base.onFocus(e) : void 0;
  },
  handleKeyDown: function(e) {
    var begin, end, _base, _ref;
    if (e.key === 'Backspace' || e.key === 'Delete') {
      _ref = this.getCursorPos(), begin = _ref.begin, end = _ref.end;
      if (begin === end) {
        if (e.key === 'Delete') {
          begin = this.seekNext(begin - 1);
          end = this.seekNext(begin);
        } else {
          begin = this.seekPrev(begin);
        }
      }
      this.shiftLeft(begin, end);
      this.setValue(this.buffer.join(''));
      e.preventDefault();
    }
    return typeof (_base = this.props).onKeyDown === "function" ? _base.onKeyDown(e) : void 0;
  },
  handleKeyPress: function(e) {
    var begin, bufferChanged, end, next, value, _base, _ref;
    if (e.key.length === 1) {
      _ref = this.getCursorPos(), begin = _ref.begin, end = _ref.end;
      this.cursorPos = begin;
      bufferChanged = false;
      if (begin !== end) {
        this.shiftLeft(begin, end);
        bufferChanged = true;
      }
      next = this.seekNext(this.cursorPos - 1);
      if (next < this.props.mask.length && this.getPattern(next).test(e.key)) {
        this.shiftRight(next);
        this.buffer[next] = e.key;
        this.cursorPos = this.seekNext(next);
        value = this.setValue(this.buffer.join(''));
        this.fireOnComplete(value);
      } else if (bufferChanged) {
        this.setValue(this.buffer.join(''));
      }
      e.preventDefault();
    }
    return typeof (_base = this.props).onKeyPress === "function" ? _base.onKeyPress(e) : void 0;
  },
  handleChange: function(e) {
    var value;
    value = this.maskedValue(e.target.value);
    this.setValue(value);
    return this.fireOnComplete(value);
  },
  maskedValue: function(input) {
    var c, i, pattern, pos, _i, _ref;
    pos = 0;
    for (i = _i = 0, _ref = this.props.mask.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      pattern = this.getPattern(i);
      if (pattern != null) {
        this.buffer[i] = this.getFormat(i);
        while (pos++ < input.length) {
          c = input[pos - 1];
          if (pattern.test(c)) {
            this.buffer[i] = c;
            break;
          }
        }
        if (pos > input.length) {
          this.clearBuffer(i + 1, this.props.mask.length);
          break;
        }
      } else if (this.buffer[i] === input[pos]) {
        pos++;
      }
    }
    this.cursorPos = i;
    return this.buffer.join('');
  },
  render: function() {
    var props;
    props = {};
    if (this.props.mask != null) {
      props.onChange = this.handleChange;
      props.onKeyPress = this.handleKeyPress;
      props.onKeyDown = this.handleKeyDown;
      props.onFocus = this.handleFocus;
      props.value = (this.props.value != null) && this.props.value !== this.state.value ? this.maskedValue(this.props.value) : this.state.value;
    }
    return React.createElement("input", React.__spread({}, this.props, props));
  }
});

module.exports = MaskedInput;



},{"react":"react"}]},{},[1])(1)
});