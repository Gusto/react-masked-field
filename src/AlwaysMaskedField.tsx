/**
 * Copyright (c) 2015 ZenPayroll
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getSelection, setSelection } from './SelectionUtils';

const DEFAULT_TRANSLATIONS: { [char: string]: RegExp | undefined } = {
  9: /\d/,
  a: /[A-Za-z]/,
  '*': /[A-Za-z0-9]/,
};

const BLANK_CHAR = '_';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export interface AlwaysMaskedFieldProps extends InputProps {
  mask: string;
  translations?: {
    [char: string]: RegExp;
  };
  value?: string;
  onComplete?: (val: string) => void;
  valueLink?: {
    value?: string;
    requestChange: (newVal: string) => void;
  };
  onChange?: (e: { target: { id?: string; name?: string; value: string } }) => void;
  inputRef?: (node: HTMLInputElement | null) => any;
}

interface MaskedFieldState {
  value: string;
}

class AlwaysMaskedField extends React.Component<AlwaysMaskedFieldProps, MaskedFieldState> {
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

  private buffer: string[] = [];

  private firstNonMaskIdx: number = -1;

  private cursorPos: number = -1;

  private input: HTMLInputElement | null = null;

  public constructor(props: Readonly<AlwaysMaskedFieldProps>) {
    super(props);

    this.buffer = this.initialBuffer();
    this.cursorPos = this.firstNonMaskIdx;

    const propsValue = this.getPropsValue();
    this.state = {
      // TODO: Any way we can do this in one pass?
      value: propsValue ? this.maskedValue(propsValue) : '',
    };
  }

  public componentDidMount() {
    const propsValue = this.getPropsValue();
    const { value } = this.state;
    if (typeof propsValue === 'string' && value !== propsValue) {
      this.callOnChange(value);
    }
  }

  public componentDidUpdate({ value: prevValue }: AlwaysMaskedFieldProps) {
    if (this.cursorPos !== -1) {
      this.setSelection(this.cursorPos);
    }
    const { value } = this.props;
    if (value && value !== prevValue && value !== this.bufferString()) {
      const maskedValue = this.maskedValue(value);
      this.setValue(maskedValue);
      this.callOnComplete(maskedValue);
    }
  }

  private getSelection() {
    if (this.input) {
      return getSelection(this.input);
    }
    const cursorPos = (this.getPropsValue() || '').length;
    return { start: cursorPos, end: cursorPos };
  }

  private getPropsValue() {
    const { valueLink, value } = this.props;
    if (valueLink) {
      return valueLink.value;
    }
    return value;
  }

  private getPattern(idx: number) {
    const { mask, translations } = this.props;
    const maskChar = mask[idx];
    const pattern = translations ? translations[maskChar] : null;

    return pattern || DEFAULT_TRANSLATIONS[maskChar];
  }

  private setSelection(start: number, end = start) {
    if (this.input && this.input === document.activeElement) {
      setSelection(this.input, start, end);
    }
  }

  private setValue(newVal: string) {
    const { value } = this.state;
    if (newVal !== value) {
      this.callOnChange(newVal);
    }
    this.setState({ value: newVal });
  }

  private handleFocus: React.FocusEventHandler<HTMLInputElement> = e => {
    setTimeout(() => this.setSelection(this.cursorPos), 0);

    const { onFocus } = this.props;
    if (onFocus) {
      onFocus(e);
    }

    this.setState({ value: this.bufferString() });
  };

  private handleBlur: React.FocusEventHandler<HTMLInputElement> = e => {
    if (this.isBufferEmpty()) {
      this.setValue('');
    }

    const { onBlur } = this.props;
    if (onBlur) {
      onBlur(e);
    }
  };

  private handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      let { start, end } = this.getSelection();

      if (start === end) {
        start = e.key === 'Delete' ? this.nextNonMaskIdx(start - 1) : this.prevNonMaskIdx(start);
        end = this.nextNonMaskIdx(start);
      }

      let newVal;
      const pattern = this.getPattern(start);
      if (pattern && pattern.test(this.buffer[end])) {
        const { value } = this.state;
        newVal = this.maskedValue(value.substring(end), start);
      } else {
        this.resetBuffer(start, end);
        newVal = this.bufferString();
      }

      this.setValue(newVal);
      this.cursorPos = Math.max(start, this.firstNonMaskIdx);

      e.preventDefault();
    }

    const { onKeyDown } = this.props;
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  private handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const value = this.maskedValue(e.target.value);
    this.setValue(value);
    this.callOnComplete(value);
  };

  private resetBuffer(start: number, end: number) {
    for (let i = start; i < end; i += 1) {
      if (this.getPattern(i)) {
        this.buffer[i] = BLANK_CHAR;
      }
    }
  }

  private initialBuffer() {
    const buffer = [];
    const { mask } = this.props;
    for (let idx = 0; idx < mask.length; idx += 1) {
      if (this.getPattern(idx)) {
        if (this.firstNonMaskIdx === -1) {
          this.firstNonMaskIdx = idx;
        }
        buffer.push('_');
      } else {
        buffer.push(mask[idx]);
      }
    }

    return buffer;
  }

  private bufferString() {
    return this.buffer.join('');
  }

  private isBufferEmpty() {
    return this.buffer.every((char, idx) => !this.getPattern(idx) || char === BLANK_CHAR);
  }

  private isBufferFull() {
    return this.buffer.every((char, idx) => !this.getPattern(idx) || char !== BLANK_CHAR);
  }

  private nextNonMaskIdx(idx: number) {
    let next = idx + 1;
    const { mask } = this.props;
    for (; next < mask.length; next += 1) {
      if (this.getPattern(next)) {
        break;
      }
    }

    return next;
  }

  private prevNonMaskIdx(idx: number) {
    let prev = idx - 1;
    for (; prev >= 0; prev -= 1) {
      if (this.getPattern(prev)) {
        break;
      }
    }

    return prev;
  }

  private callOnChange(value: string) {
    const { id, name, valueLink, onChange } = this.props;
    if (valueLink) {
      valueLink.requestChange(value);
    } else if (onChange) {
      onChange({ target: { id, name, value } });
    }
  }

  private callOnComplete(value: string) {
    const { onComplete } = this.props;
    if (onComplete && this.isBufferFull()) {
      onComplete(value);
    }
  }

  private maskedValue(value: string, start = 0) {
    this.cursorPos = this.getSelection().start;
    const originalCursorPos = this.cursorPos;
    const { mask } = this.props;
    for (let bufferIdx = start, valueIdx = 0; bufferIdx < mask.length; bufferIdx += 1) {
      const pattern = this.getPattern(bufferIdx);
      if (pattern) {
        const lastPatternIdx = bufferIdx;
        this.buffer[bufferIdx] = BLANK_CHAR;
        while (valueIdx < value.length && bufferIdx < mask.length) {
          const c = value[valueIdx];
          valueIdx += 1;
          if (c === this.buffer[bufferIdx]) {
            bufferIdx += 1;
          } else if (pattern.test(c)) {
            while (this.buffer[bufferIdx] !== '_' && bufferIdx < this.buffer.length) {
              bufferIdx += 1;
            }
            if (this.buffer[bufferIdx] !== undefined) {
              this.buffer[bufferIdx] = c;
            }
            break;
          } else if (this.cursorPos > lastPatternIdx) {
            this.cursorPos -= 1;
          }
        }

        if (valueIdx >= value.length) {
          this.resetBuffer(lastPatternIdx + 1, mask.length);
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

    return this.bufferString();
  }

  public render() {
    const {
      mask,
      translations,
      onComplete,
      valueLink,
      placeholder,
      inputRef,
      ...props
    } = this.props;
    const { value } = this.state;

    return (
      <input
        ref={c => {
          this.input = c;
          if (inputRef) {
            inputRef(c);
          }
        }}
        {...props}
        onChange={this.handleChange}
        onKeyDown={this.handleKeyDown}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        value={value}
        placeholder={placeholder || this.initialBuffer().join('')}
        type="text"
      />
    );
  }
}

export default AlwaysMaskedField;
