
/**
* Copyright (c) 2015 ZenPayroll
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash.omit';
import { getSelection, setSelection } from './SelectionUtils';

const DEFAULT_TRANSLATIONS = {
  9: /\d/,
  a: /[A-Za-z]/,
  '*': /[A-Za-z0-9]/
};

const BLANK_CHAR = '_';

class MaskedField extends React.Component {
  static propTypes =  {
    mask: PropTypes.string,
    translations: PropTypes.object,
    value: PropTypes.string,
    placeholder: PropTypes.string,
    onChange: PropTypes.func,
    onKeyDown: PropTypes.func,
    onComplete: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    // TODO: shape
    valueLink: PropTypes.object
  };

  constructor(props) {
    super(props);

    if (!props.mask) {
      return;
    }

    this._buffer = this._initialBuffer();
    this._cursorPos = this._firstNonMaskIdx;

    const propsValue = this._getPropsValue();
    this.state = {
      // TODO: Any way we can do this in one pass?
      value: propsValue ? this._maskedValue(propsValue) : ''
    };
  }

  componentDidUpdate() {
    if (this._cursorPos !== undefined) {
      this._setSelection(this._cursorPos);
    }
  }

  componentDidMount() {
    this._isMounted = true;
    const propsValue = this._getPropsValue();
    if (this.props.mask && typeof propsValue === 'string' && this.state.value !== propsValue) {
      this._callOnChange(this.state.value);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    let props = omit(this.props, 'mask', 'translations', 'onComplete');
    let maskProps = {};
    if (this.props.mask) {
      maskProps = {
        onChange: this._handleChange,
        onKeyDown: this._handleKeyDown,
        onFocus: this._handleFocus,
        onBlur: this._handleBlur,
        value: this.state.value
      };
      props = omit(props, 'valueLink');

      if (!this.props.placeholder) {
        maskProps.placeholder = this._initialBuffer().join('');
      }
    }

    return <input ref={c => (this._input = c)} {...props} {...maskProps} type='text' />;
  }

  _getSelection() {
    if (this._isMounted) {
      return getSelection(this._input);
    } else {
      const cursorPos = (this._getPropsValue() || '').length;
      return { start: cursorPos, end: cursorPos };
    }
  }

  _setSelection(start, end = start) {
    if (this._input === document.activeElement) {
      setSelection(this._input, start, end);
    }
  }

  _getPropsValue() {
    if (this.props.valueLink) {
      return this.props.valueLink.value;
    } else {
      return this.props.value;
    }
  }

  _getPattern(idx) {
    const maskChar = this.props.mask[idx];
    const pattern = this.props.translations ? this.props.translations[maskChar] : null;

    return pattern || DEFAULT_TRANSLATIONS[maskChar];
  }

  _resetBuffer(start, end) {
    for (let i = start; i < end; ++i) {
      if (this._getPattern(i)) {
        this._buffer[i] = BLANK_CHAR;
      }
    }
  }

  _initialBuffer() {
    const buffer = [];
    for (let idx = 0; idx < this.props.mask.length; ++idx) {
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
  }

  _isBufferEmpty() {
    return this._buffer.every((char, idx) => !this._getPattern(idx) || char === BLANK_CHAR);
  }

  _isBufferFull() {
    return this._buffer.every((char, idx) => !this._getPattern(idx) || char !== BLANK_CHAR);
  }

  _nextNonMaskIdx(idx) {
    let next = idx + 1;
    for (; next < this.props.mask.length; ++next) {
      if (this._getPattern(next)) {
        break;
      }
    }

    return next;
  }

  _prevNonMaskIdx(idx) {
    let prev = idx - 1;
    for (; prev >= 0; --prev) {
      if (this._getPattern(prev)) {
        break;
      }
    }

    return prev;
  }

  _callOnChange(value) {
    if (this.props.valueLink) {
      this.props.valueLink.requestChange(value);
    } else if (this.props.onChange) {
      this.props.onChange({ target: { value } });
    }
  }

  _callOnComplete(value) {
    if (this.props.onComplete && this._isBufferFull()) {
      this.props.onComplete(value);
    }
  }

  _setValue(value) {
    if (value !== this.state.value) {
      this._callOnChange(value);
    }
    this.setState({ value });
  }

  _handleFocus = (e) => {
    setTimeout(() => this._setSelection(this._cursorPos), 0);

    if (this.props.onFocus) {
      this.props.onFocus(e);
    }

    this.setState({ value: this._buffer.join('') });
  }

  _handleBlur = (e) => {
    if (this._isBufferEmpty()) {
      this._setValue('');
    }

    if (this.props.onBlur) {
      this.props.onBlur(e);
    }
  }

  _handleKeyDown = (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      let { start, end } = this._getSelection();

      if (start === end) {
        start = e.key === 'Delete' ? this._nextNonMaskIdx(start - 1) : this._prevNonMaskIdx(start);
        end = this._nextNonMaskIdx(start);
      }

      let value;
      const pattern = this._getPattern(start);
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
  }

  _handleChange = (e) => {
    const value = this._maskedValue(e.target.value);
    this._setValue(value);
    this._callOnComplete(value);
  }

  _maskedValue(value, start = 0) {
    const originalCursorPos = this._cursorPos = this._getSelection().start;
    for (let bufferIdx = start, valueIdx = 0; bufferIdx < this.props.mask.length; ++bufferIdx) {
      const pattern = this._getPattern(bufferIdx);
      if (pattern) {
        const lastPatternIdx = bufferIdx;
        this._buffer[bufferIdx] = BLANK_CHAR;
        while (valueIdx < value.length && bufferIdx < this.props.mask.length) {
          const c = value[valueIdx++];
          if (c === this._buffer[bufferIdx]) {
            bufferIdx++;
          } else if (pattern.test(c)) {
            while (this._buffer[bufferIdx] !== '_') {
              bufferIdx++;
            }
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
      } else if (this._buffer[bufferIdx] === value[valueIdx]) {
        if (valueIdx === originalCursorPos) {
          this._cursorPos++;
        }

        valueIdx++;
      } else if (valueIdx <= originalCursorPos) {
        this._cursorPos++;
      }
    }

    return this._buffer.join('');
  }
}

module.exports = MaskedField;
