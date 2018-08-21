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
  '*': /[A-Za-z0-9]/,
};

const BLANK_CHAR = '_';

class MaskedField extends React.Component {
  static propTypes = {
    mask: PropTypes.string,
    translations: PropTypes.objectOf(PropTypes.instanceOf(RegExp)),
    value: PropTypes.string,
    placeholder: PropTypes.string,
    onChange: PropTypes.func,
    onKeyDown: PropTypes.func,
    onComplete: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    valueLink: PropTypes.shape({
      value: PropTypes.string.isRequired,
      requestChange: PropTypes.func.isRequired,
    }),
  };

  static defaultProps = {
    mask: undefined,
    translations: undefined,
    value: undefined,
    placeholder: undefined,
    onChange: undefined,
    onKeyDown: undefined,
    onComplete: undefined,
    onFocus: undefined,
    onBlur: undefined,
    valueLink: undefined,
  };

  constructor(props) {
    super(props);

    if (!props.mask) {
      return;
    }

    this.buffer = this.initialBuffer();
    this.cursorPos = this.firstNonMaskIdx;

    const propsValue = this.getPropsValue();
    this.state = {
      // TODO: Any way we can do this in one pass?
      value: propsValue ? this.maskedValue(propsValue) : '',
    };
  }

  componentDidMount() {
    this.mounted = true;
    const propsValue = this.getPropsValue();
    if (this.props.mask && typeof propsValue === 'string' && this.state.value !== propsValue) {
      this.callOnChange(this.state.value);
    }
  }

  componentDidUpdate() {
    if (this.cursorPos !== undefined) {
      this.setSelection(this.cursorPos);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  getSelection() {
    if (this.mounted) {
      return getSelection(this.input);
    }
    const cursorPos = (this.getPropsValue() || '').length;
    return { start: cursorPos, end: cursorPos };
  }

  getPropsValue() {
    if (this.props.valueLink) {
      return this.props.valueLink.value;
    }
    return this.props.value;
  }

  getPattern(idx) {
    const maskChar = this.props.mask[idx];
    const pattern = this.props.translations ? this.props.translations[maskChar] : null;

    return pattern || DEFAULT_TRANSLATIONS[maskChar];
  }

  setSelection(start, end = start) {
    if (this.input === document.activeElement) {
      setSelection(this.input, start, end);
    }
  }

  setValue(value) {
    if (value !== this.state.value) {
      this.callOnChange(value);
    }
    this.setState({ value });
  }

  resetBuffer(start, end) {
    for (let i = start; i < end; i += 1) {
      if (this.getPattern(i)) {
        this.buffer[i] = BLANK_CHAR;
      }
    }
  }

  initialBuffer() {
    const buffer = [];
    for (let idx = 0; idx < this.props.mask.length; idx += 1) {
      if (this.getPattern(idx)) {
        if (this.firstNonMaskIdx === undefined) {
          this.firstNonMaskIdx = idx;
        }
        buffer.push('_');
      } else {
        buffer.push(this.props.mask[idx]);
      }
    }

    return buffer;
  }

  isBufferEmpty() {
    return this.buffer.every((char, idx) => !this.getPattern(idx) || char === BLANK_CHAR);
  }

  isBufferFull() {
    return this.buffer.every((char, idx) => !this.getPattern(idx) || char !== BLANK_CHAR);
  }

  nextNonMaskIdx(idx) {
    let next = idx + 1;
    for (; next < this.props.mask.length; next += 1) {
      if (this.getPattern(next)) {
        break;
      }
    }

    return next;
  }

  prevNonMaskIdx(idx) {
    let prev = idx - 1;
    for (; prev >= 0; prev -= 1) {
      if (this.getPattern(prev)) {
        break;
      }
    }

    return prev;
  }

  callOnChange(value) {
    if (this.props.valueLink) {
      this.props.valueLink.requestChange(value);
    } else if (this.props.onChange) {
      this.props.onChange({ target: { value } });
    }
  }

  callOnComplete(value) {
    if (this.props.onComplete && this.isBufferFull()) {
      this.props.onComplete(value);
    }
  }

  handleFocus = e => {
    setTimeout(() => this.setSelection(this.cursorPos), 0);

    if (this.props.onFocus) {
      this.props.onFocus(e);
    }

    this.setState({ value: this.buffer.join('') });
  };

  handleBlur = e => {
    if (this.isBufferEmpty()) {
      this.setValue('');
    }

    if (this.props.onBlur) {
      this.props.onBlur(e);
    }
  };

  handleKeyDown = e => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      let { start, end } = this.getSelection();

      if (start === end) {
        start = e.key === 'Delete' ? this.nextNonMaskIdx(start - 1) : this.prevNonMaskIdx(start);
        end = this.nextNonMaskIdx(start);
      }

      let value;
      const pattern = this.getPattern(start);
      if (pattern && pattern.test(this.buffer[end])) {
        value = this.maskedValue(this.state.value.substring(end), start);
      } else {
        this.resetBuffer(start, end);
        value = this.buffer.join('');
      }

      this.setValue(value);
      this.cursorPos = Math.max(start, this.firstNonMaskIdx);

      e.preventDefault();
    }

    if (this.props.onKeyDown) {
      this.props.onKeyDown(e);
    }
  };

  handleChange = e => {
    const value = this.maskedValue(e.target.value);
    this.setValue(value);
    this.callOnComplete(value);
  };

  maskedValue(value, start = 0) {
    this.cursorPos = this.getSelection().start;
    const originalCursorPos = this.cursorPos;
    for (let bufferIdx = start, valueIdx = 0; bufferIdx < this.props.mask.length; bufferIdx += 1) {
      const pattern = this.getPattern(bufferIdx);
      if (pattern) {
        const lastPatternIdx = bufferIdx;
        this.buffer[bufferIdx] = BLANK_CHAR;
        while (valueIdx < value.length && bufferIdx < this.props.mask.length) {
          const c = value[valueIdx];
          valueIdx += 1;
          if (c === this.buffer[bufferIdx]) {
            bufferIdx += 1;
          } else if (pattern.test(c)) {
            while (this.buffer[bufferIdx] !== '_') {
              bufferIdx += 1;
            }
            this.buffer[bufferIdx] = c;
            break;
          } else if (this.cursorPos > lastPatternIdx) {
            this.cursorPos -= 1;
          }
        }

        if (valueIdx >= value.length) {
          this.resetBuffer(lastPatternIdx + 1, this.props.mask.length);
          break;
        }
      } else if (this.buffer[bufferIdx] === value[valueIdx]) {
        if (valueIdx === originalCursorPos) {
          this.cursorPos += 1;
        }

        valueIdx += 1;
      } else if (valueIdx <= originalCursorPos) {
        this.cursorPos += 1;
      }
    }

    return this.buffer.join('');
  }

  render() {
    const props = omit(this.props, 'mask', 'translations', 'onComplete', 'valueLink');
    let maskProps = {};
    if (this.props.mask) {
      maskProps = {
        onChange: this.handleChange,
        onKeyDown: this.handleKeyDown,
        onFocus: this.handleFocus,
        onBlur: this.handleBlur,
        value: this.state.value,
      };

      if (!this.props.placeholder) {
        maskProps.placeholder = this.initialBuffer().join('');
      }
    }

    return (
      <input
        ref={c => {
          this.input = c;
        }}
        {...props}
        {...maskProps}
        type="text"
      />
    );
  }
}

module.exports = MaskedField;
