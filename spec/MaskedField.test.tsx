/* eslint-disable react/no-multi-comp */

import React from 'react';
import PropTypes from 'prop-types';
import { mount, configure as configureEnzyme, ReactWrapper } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import MaskedField, { MaskedFieldProps } from '../src/index';
import * as EventUtils from './EventUtils';

configureEnzyme({ adapter: new Adapter() });

// eslint-disable-next-line no-console
console.error = (message: string) => {
  throw new Error(message);
};

interface TestProps extends MaskedFieldProps {
  onChange?: jest.Mock;
  onComplete?: jest.Mock;
  onKeyDown?: jest.Mock;
  onKeyPress?: jest.Mock;
}

describe('MaskedField', () => {
  let container: HTMLDivElement;
  let component: ReactWrapper;
  let domNode: HTMLInputElement;
  const props: TestProps = { id: 'masked-field', name: 'masked_field' };

  // FIXME:
  // - undo?

  const getField = () => component.find(MaskedField);
  const inputNode = () =>
    getField()
      .find('input')
      .getDOMNode() as HTMLInputElement;
  const getFieldValue = () => inputNode().value;

  function cursorPosShouldEql(pos: number) {
    const node = inputNode();
    expect(node.selectionStart).toEqual(pos);
    expect(node.selectionEnd).toEqual(pos);
  }

  const setSelection = (start: number, end = start) => inputNode().setSelectionRange(start, end);
  const simulateKeyPress = (key: string) => EventUtils.simulateKeyPress(getField(), key);
  const simulateKeyDown = (key: string) => EventUtils.simulateKeyDown(getField(), key);
  const simulatePaste = (content: string) => EventUtils.simulateChange(getField(), content);
  const simulateTyping = (content: string) => EventUtils.simulateTyping(getField(), content);
  const simulateFocus = () => EventUtils.simulateFocus(getField());
  const simulateBlur = () => EventUtils.simulateBlur(getField());

  const render = (element: JSX.Element) => mount(element, { attachTo: container });

  function setupTests(isControlled: boolean, additionalTests: () => void) {
    describe('when the field is focused', () => {
      beforeEach(simulateFocus);

      describe("when the mask is '99/99/9999'", () => {
        beforeAll(() => {
          props.mask = '99/99/9999';
        });

        additionalTests();

        describe('typing a key', () => {
          beforeAll(() => {
            props.onChange = jest.fn();
            props.onComplete = jest.fn();
          });

          afterAll(() => {
            delete props.onChange;
            delete props.onComplete;
          });

          beforeEach(() => {
            props.onChange!.mockClear();
          });

          afterEach(() => {
            props.onChange!.mockClear();
            props.onComplete!.mockClear();
          });

          describe('the initial cursor position is at a mask index', () => {
            beforeEach(() => {
              setSelection(2, 2);
              simulateKeyPress('2');
            });

            it('inserts at the index after the mask character', () => {
              expect(getFieldValue()).toEqual('__/2_/____');
            });
          });

          describe('when the character matches the mask', () => {
            beforeEach(() => {
              simulateKeyPress('2');
            });

            it('adds the character to the value', () => {
              expect(getFieldValue()[0]).toEqual('2');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).toEqual('2_/__/____');
            });

            it('calls the onChange callback', () => {
              expect(props.onChange).toHaveBeenCalledTimes(1);
              expect(props.onChange).toHaveBeenCalledWith({
                target: {
                  id: props.id,
                  name: props.name,
                  value: '2_/__/____',
                },
              });
            });

            it("doesn't call the onComplete callback", () => {
              expect(props.onComplete).toHaveBeenCalledTimes(0);
            });

            describe('when the next character is a mask character', () => {
              beforeEach(() => {
                simulateKeyPress('3');
              });

              it('moves the cursor past the mask character', () => {
                expect(getFieldValue()).toEqual('23/__/____');
                cursorPosShouldEql(3);
              });
            });

            describe('when the cursor is in the middle of the value', () => {
              beforeEach(() => {
                simulateTyping('34');
                setSelection(1);
                simulateKeyPress('5');
              });

              it('adds the character to the value', () => {
                expect(getFieldValue()[1]).toEqual('5');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(3);
              });
            });

            describe('when the cursor is in the middle an empty field', () => {
              beforeEach(() => {
                setSelection(4);
                simulateKeyPress('5');
              });

              it('adds the character to the value', () => {
                expect(getFieldValue()[4]).toEqual('5');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(6);
              });
            });

            describe('when field text is selected', () => {
              beforeEach(() => {
                simulateTyping('345');
                setSelection(1, 5);
                simulateKeyPress('6');
              });

              it('replaces the selected characters', () => {
                expect(getFieldValue().substring(1, 5)).toEqual('6/__');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(3);
              });

              it('correctly shifts the mask characters', () => {
                expect(getFieldValue()).toEqual('26/__/____');
              });

              it('calls the onChange callback', () => {
                expect(props.onChange).toHaveBeenCalledTimes(5);
              });
            });

            describe('when the entire mask is filled', () => {
              beforeEach(() => {
                simulateTyping('2345678');
              });

              it('calls the onComplete callback', () => {
                expect(props.onComplete).toHaveBeenCalledTimes(1);
                expect(props.onComplete).toHaveBeenCalledWith('22/34/5678');
              });
            });
          });

          describe("when the character doesn't match the mask", () => {
            beforeEach(() => {
              simulateKeyPress('A');
            });

            it("doesn't change the value", () => {
              expect(getFieldValue()).toEqual('__/__/____');
            });

            it("doesn't change the cursor position", () => {
              cursorPosShouldEql(0);
            });

            it("doesn't call the onChange callback", () => {
              expect(props.onChange).toHaveBeenCalledTimes(0);
            });

            describe('when the cursor is in the middle of the value', () => {
              beforeEach(() => {
                simulateTyping('123');
                setSelection(1);
                simulateKeyPress('A');
              });

              it("doesn't change the value", () => {
                expect(getFieldValue()).toEqual('12/3_/____');
              });

              it("doesn't change the cursor position", () => {
                cursorPosShouldEql(1);
              });
            });

            describe('when field text is selected', () => {
              beforeEach(() => {
                simulateTyping('12345');
                setSelection(1, 5);
                simulateKeyPress('A');
              });

              it('removes the selected characters', () => {
                expect(getFieldValue().substring(1, 5)).toEqual('5/__');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(1);
              });

              it('correctly shifts the mask characters', () => {
                expect(getFieldValue()).toEqual('15/__/____');
              });
            });
          });
        });

        describe('pressing the backspace key', () => {
          beforeEach(() => {
            simulateTyping('123');
            simulateKeyDown('Backspace');
          });

          it('removes the preceding character', () => {
            expect(getFieldValue()[3]).toEqual('_');
          });

          it('moves the cursor to the correct position', () => {
            cursorPosShouldEql(3);
          });

          it('correctly shifts the mask characters', () => {
            expect(getFieldValue()).toEqual('12/__/____');
          });

          describe('when the previous character is a mask character', () => {
            beforeEach(() => {
              simulateKeyDown('Backspace');
            });

            it('removes the preceding non-mask character', () => {
              expect(getFieldValue()[1]).toEqual('_');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).toEqual('1_/__/____');
            });

            describe('typing another character', () => {
              beforeEach(() => {
                simulateKeyPress('1');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(3);
              });
            });
          });

          describe('when the next character is a mask character', () => {
            beforeEach(() => {
              simulateKeyPress('3');
              setSelection(2);
              simulateKeyDown('Backspace');
            });

            it('correctly shifts the non-mask characters', () => {
              expect(getFieldValue()).toEqual('13/__/____');
            });
          });

          describe('when the cursor is at the beginning', () => {
            beforeEach(() => {
              setSelection(0);
              simulateKeyDown('Backspace');
            });

            it("doesn't change the value", () => {
              expect(getFieldValue()).toEqual('12/__/____');
            });
          });

          describe('when field text is selected', () => {
            beforeEach(() => {
              simulateTyping('345');
              setSelection(1, 4);
              simulateKeyDown('Backspace');
            });

            it('removes the selected characters', () => {
              expect(getFieldValue().substring(1, 4)).toEqual('4/5');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).toEqual('14/5_/____');
            });
          });
        });
        describe('pressing the delete key', () => {
          beforeAll(() => {
            props.onKeyDown = jest.fn();
          });

          afterAll(() => {
            delete props.onKeyDown;
          });

          afterEach(() => {
            props.onKeyDown!.mockClear();
          });

          beforeEach(() => {
            simulateTyping('1234');
            setSelection(1);
            simulateKeyDown('Delete');
          });

          it('removes the following non-mask character', () => {
            expect(getFieldValue()[3]).toEqual('4');
          });

          it("doesn't move the cursor", () => {
            cursorPosShouldEql(1);
          });

          it('correctly shifts the mask characters', () => {
            expect(getFieldValue()).toEqual('13/4_/____');
          });

          it('calls the onKeyDown callback', () => {
            expect(props.onKeyDown).toHaveBeenCalledTimes(1);
          });

          describe('when the following character is a mask character', () => {
            beforeEach(() => {
              setSelection(2);
              simulateKeyDown('Delete');
            });

            it('removes the following non-mask character', () => {
              expect(getFieldValue()[3]).toEqual('_');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(3);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).toEqual('13/__/____');
            });
          });

          describe('when field text is selected', () => {
            beforeEach(() => {
              simulateTyping('25');
              setSelection(1, 4);
              simulateKeyDown('Delete');
            });

            it('removes the selected characters', () => {
              expect(getFieldValue().substring(1, 4)).toEqual('3/4');
            });

            it("doesn't move the cursor", () => {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).toEqual('13/4_/____');
            });
          });
        });

        describe('pasting', () => {
          describe('when the pasted content contains only valid characters', () => {
            beforeAll(() => {
              props.onChange = jest.fn();
              props.onComplete = jest.fn();
            });

            afterAll(() => {
              delete props.onChange;
              delete props.onComplete;
            });

            beforeEach(() => {
              props.onChange!.mockClear();
              simulatePaste('12345');
            });

            afterEach(() => {
              props.onChange!.mockClear();
              props.onComplete!.mockClear();
            });

            it('adds the content to the value', () => {
              expect(getFieldValue()).toEqual('12/34/5___');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(7);
            });

            it('calls the onChange callback', () => {
              expect(props.onChange).toHaveBeenCalledTimes(1);
              expect(props.onChange).toHaveBeenCalledWith({
                target: {
                  id: props.id,
                  name: props.name,
                  value: '12/34/5___',
                },
              });
            });

            it("doesn't call the onComplete callback", () => {
              expect(props.onComplete).toHaveBeenCalledTimes(0);
            });

            describe('when the entire mask is filled', () => {
              beforeEach(() => {
                simulatePaste('678');
              });

              it('calls the onComplete callback', () => {
                expect(props.onComplete).toHaveBeenCalledTimes(1);
                expect(props.onComplete).toHaveBeenCalledWith('12/34/5678');
              });
            });

            describe('when field text is selected', () => {
              beforeEach(() => {
                setSelection(1, 5);
                simulatePaste('67');
              });

              it('replaces the selected characters', () => {
                expect(getFieldValue().substring(1, 5)).toEqual('6/75');
              });

              // TODO: Is this the right behavior?
              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(4);
              });

              it('correctly shifts the mask characters', () => {
                expect(getFieldValue()).toEqual('16/75/____');
              });
            });
          });

          describe('when the pasted content contains invalid characters', () => {
            beforeEach(() => {
              simulateKeyPress('1');
              simulatePaste('2a3b4c5');
            });

            it('adds the valid content to the value', () => {
              expect(getFieldValue()).toEqual('12/34/5___');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(7);
            });

            describe('when field text is selected', () => {
              beforeEach(() => {
                setSelection(1, 5);
                simulatePaste('6a7b');
              });

              it('replaces the selected characters', () => {
                expect(getFieldValue().substring(1, 5)).toEqual('6/75');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(4);
              });

              it('correctly shifts the mask characters', () => {
                expect(getFieldValue()).toEqual('16/75/____');
              });
            });
          });
        });

        describe('setting an initial value', () => {
          beforeAll(() => {
            props.value = '0101201';
          });

          afterAll(() => {
            delete props.value;
          });

          it('correctly masks the initial value', () => {
            expect(getFieldValue()).toEqual('01/01/201_');
          });

          it('moves the cursor to the correct position', () => {
            cursorPosShouldEql(9);
          });
        });

        describe('blurring', () => {
          describe('when the field contains no valid characters', () => {
            beforeEach(simulateBlur);

            it('sets the value to blank', () => {
              expect(getFieldValue()).toEqual('');
            });
          });

          describe('when the field contains valid characters', () => {
            beforeEach(() => {
              simulateKeyPress('2');
              simulateBlur();
            });

            it('does not change the value', () => {
              expect(getFieldValue()).toEqual('2_/__/____');
            });
          });

          describe('when the field removes all valid characters', () => {
            beforeAll(() => {
              props.onChange = jest.fn();
            });

            beforeEach(() => {
              simulateKeyPress('2');
              simulateKeyDown('Backspace');
              props.onChange!.mockClear();
              simulateBlur();
            });

            it('sets the value to blank', () => {
              expect(getFieldValue()).toEqual('');
            });

            it('calls the onChange callback', () => {
              expect(props.onChange).toHaveBeenCalledTimes(1);
            });
          });
        });
      });

      describe("when the mask is '(999) 999-9999'", () => {
        beforeAll(() => {
          props.mask = '(999) 999-9999';
        });

        beforeEach(() => {
          setSelection(9, 9);
          simulateKeyPress('1');
        });

        it('inserts at the index after the mask character', () => {
          expect(getFieldValue()).toEqual('(___) ___-1___');
        });
      });

      describe("when the mask is '99//99'", () => {
        beforeAll(() => {
          props.mask = '99//99';
        });

        beforeEach(() => {
          setSelection(2, 2);
          simulateKeyPress('1');
        });

        it('inserts at the index after the mask character', () => {
          expect(getFieldValue()).toEqual('__//1_');
        });
      });

      describe("when the mask is 'a-99'", () => {
        beforeAll(() => {
          props.mask = 'a-99';
        });

        describe('pressing the backspace key', () => {
          beforeEach(() => {
            simulateTyping('a12');
            setSelection(1);
            simulateKeyDown('Backspace');
          });

          it('removes the preceding character', () => {
            expect(getFieldValue()[0]).toEqual('_');
          });

          it('moves the cursor to the correct position', () => {
            cursorPosShouldEql(0);
          });

          it('correctly shifts the mask characters', () => {
            expect(getFieldValue()).toEqual('_-12');
          });
        });
      });

      describe("when the mask is 'aaaaaaaa'", () => {
        beforeAll(() => {
          props.mask = 'aaaaaaaa';
        });

        it('sets the placeholder correctly', () => {
          expect(domNode.placeholder).toEqual('________');
        });

        describe('pressing the enter key', () => {
          beforeAll(() => {
            props.onKeyPress = jest.fn();
          });

          afterAll(() => {
            delete props.onKeyPress;
          });

          beforeEach(() => {
            simulateKeyPress('Enter');
          });

          afterEach(() => {
            props.onKeyPress!.mockClear();
          });

          it("doesn't change the value", () => {
            expect(getFieldValue()).toEqual('________');
          });

          it('calls the onKeyPress callback', () => {
            expect(props.onKeyPress).toHaveBeenCalledTimes(1);
          });
        });
      });

      describe("when the mask is '21-99999999'", () => {
        beforeAll(() => {
          props.mask = '21-99999999';
        });

        describe('initial state', () => {
          it('sets the cursor to the first non-mask character', () => {
            cursorPosShouldEql(3);
          });
        });

        describe('pasting', () => {
          describe('when the cursor is at the beginning', () => {
            beforeEach(() => {
              simulatePaste('12345678');
            });

            it('adds the content to the value', () => {
              expect(getFieldValue()).toEqual('21-12345678');
            });
          });
        });

        describe('pressing the backspace key', () => {
          describe('when the cursor is after a non-mask character', () => {
            beforeEach(() => {
              simulateKeyDown('Backspace');
            });

            it('moves the cursor to the first non-mask position', () => {
              cursorPosShouldEql(3);
            });
          });

          describe('when the entire mask is selected', () => {
            beforeEach(() => {
              setSelection(0, 11);
              simulateKeyDown('Backspace');
            });

            it('moves the cursor to the first non-mask position', () => {
              cursorPosShouldEql(3);
            });
          });
        });
      });

      describe("when the mask is 'ZZ-999-ZZ-999'", () => {
        beforeAll(() => {
          props.mask = 'ZZ-999-ZZ-999';
        });

        describe('pasting', () => {
          describe('when the cursor is at the beginning', () => {
            beforeEach(() => {
              simulatePaste('123123');
            });

            it('adds the content to the value', () => {
              expect(getFieldValue()).toEqual('ZZ-123-ZZ-123');
            });
          });
        });
      });

      describe("when the mask is '036-9999999999-09'", () => {
        beforeAll(() => {
          props.mask = '036-9999999999-09';
        });

        describe('typing a key', () => {
          describe('when the character matches the mask', () => {
            beforeEach(() => {
              simulateKeyPress('2');
            });

            it('adds the character to the value', () => {
              expect(getFieldValue()[4]).toEqual('2');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(5);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).toEqual('036-2_________-0_');
            });

            describe('when the next character is a mask character', () => {
              beforeEach(() => {
                simulateTyping('345678912');
              });

              it('adds the character to the value', () => {
                expect(getFieldValue().substring(5, 14)).toEqual('345678912');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(16);
              });

              it('correctly shifts the mask characters', () => {
                expect(getFieldValue()).toEqual('036-2345678912-0_');
              });
            });
          });
        });
      });

      describe('when there is no mask', () => {
        beforeAll(() => {
          delete props.mask;
        });

        describe('setting an initial value', () => {
          beforeAll(() => {
            props.value = '123abc';
          });

          it('contains the initial value', () => {
            expect(getFieldValue()).toEqual('123abc');
          });
        });

        describe('typing keys', () => {
          beforeAll(() => {
            props.value = '';
          });

          beforeEach(() => {
            props.onChange!.mockClear();
            simulateTyping('1a2b3c');
          });

          it('calls the onChange prop', () => {
            expect(props.onChange).toHaveBeenCalledTimes(6);
          });

          if (isControlled) {
            it('adds the characters to the value', () => {
              expect(getFieldValue()).toEqual('1a2b3c');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(6);
            });
          }
        });
      });

      describe('when there is a pattern provided', () => {
        beforeAll(() => {
          props.mask = 'FFF';
          props.translations = {
            F: /[F]/,
          };
        });

        describe('typing a key', () => {
          describe('when the character matches the mask', () => {
            beforeEach(() => {
              simulateKeyPress('F');
            });

            it('adds the character to the value', () => {
              expect(getFieldValue()[0]).toEqual('F');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(1);
            });
          });

          describe("when the character doesn't match the mask", () => {
            beforeEach(() => {
              simulateKeyPress('A');
            });

            it("doesn't change the value", () => {
              expect(getFieldValue()).toEqual('___');
            });

            it("doesn't change the cursor position", () => {
              cursorPosShouldEql(0);
            });
          });
        });
      });
    });
  }

  beforeAll(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component.detach();
  });

  describe("when the component isn't controlled", () => {
    beforeAll(() => {
      delete props.value;
    });

    beforeEach(() => {
      if (props.value && !props.onChange) {
        props.readOnly = true;
      }
      component = render(<MaskedField id="masked-field" name="masked_field" {...props} />);
      domNode = inputNode();
    });

    afterEach(() => {
      delete props.readOnly;
    });

    setupTests(false, () => {
      describe('the placeholder', () => {
        describe('when a placeholder is given', () => {
          beforeAll(() => {
            props.placeholder = 'mm/dd/yyyy';
          });

          afterAll(() => {
            delete props.placeholder;
          });

          it('fills in the placeholder with the provided characters', () => {
            expect(domNode.placeholder).toEqual('mm/dd/yyyy');
          });
        });

        describe('when no placeholder is given', () => {
          it('fills in the placeholder with the default character', () => {
            expect(domNode.placeholder).toEqual('__/__/____');
          });
        });
      });

      describe('the input ref', () => {
        let refNode: HTMLInputElement;

        beforeAll(() => {
          props.inputRef = node => {
            if (node) {
              refNode = node;
            }
          };
        });

        it('correctly passes the input ref', () => {
          expect(refNode).toEqual(inputNode());
        });
      });
    });

    describe('when the field is not focused', () => {
      beforeAll(() => {
        props.mask = '99/99/9999';
      });

      it('has a blank value', () => {
        expect(getFieldValue()).toEqual('');
      });
    });
  });

  describe('when the component is controlled', () => {
    class ControlledWrapper extends React.Component<MaskedFieldProps> {
      static propTypes = {
        value: PropTypes.string,
        onChange: PropTypes.func,
      };

      static defaultProps = {
        value: undefined,
        onChange: undefined,
      };

      state = {
        // eslint-disable-next-line react/destructuring-assignment
        value: this.props.value,
      };

      handleChange: MaskedFieldProps['onChange'] = e => {
        const { onChange } = this.props;
        if (onChange) {
          onChange(e);
        }
        this.setState({ value: e.target.value });
      };

      render() {
        const { value } = this.state;
        return <MaskedField {...this.props} value={value} onChange={this.handleChange} />;
      }
    }

    beforeAll(() => {
      props.value = '';
    });

    beforeEach(() => {
      component = render(<ControlledWrapper id="masked-field" name="masked_field" {...props} />);
      domNode = inputNode();
    });

    setupTests(true, () => {
      describe('initial render', () => {
        beforeAll(() => {
          props.onChange = jest.fn();
        });

        afterAll(() => {
          delete props.onChange;
        });

        afterEach(() => {
          props.onChange!.mockClear();
        });

        describe('when the initial value is blank', () => {
          it('does not call the onChange callback', () => {
            expect(props.onChange).toHaveBeenCalledTimes(0);
          });
        });

        describe('when the initial value matches the placeholder', () => {
          beforeAll(() => {
            props.value = '__/__/____';
          });

          afterAll(() => {
            props.value = '';
          });

          it('does not call the onChange callback', () => {
            expect(props.onChange).toHaveBeenCalledTimes(0);
          });
        });

        describe("when the initial value doesn't change when masked", () => {
          beforeAll(() => {
            props.value = '1_/__/____';
          });

          afterAll(() => {
            props.value = '';
          });

          it('does not call the onChange callback', () => {
            expect(props.onChange).toHaveBeenCalledTimes(0);
          });
        });
      });
    });
  });

  describe('when the component uses ReactLink', () => {
    let initialVal = '';

    interface LinkWrapperProps extends MaskedFieldProps {
      value: string;
    }

    class LinkWrapper extends React.Component<LinkWrapperProps, { value?: string }> {
      static propTypes = {
        value: PropTypes.string,
      };

      static defaultProps = {
        value: undefined,
      };

      state = {
        // eslint-disable-next-line react/destructuring-assignment
        value: this.props.value,
      };

      render() {
        const { value } = this.state;
        const valueLink = {
          value,
          requestChange: (val: string) => this.setState({ value: val }),
        };
        return <MaskedField {...this.props} valueLink={valueLink} />;
      }
    }

    beforeEach(() => {
      component = render(<LinkWrapper id="id" name="name" mask="99/99/9999" value={initialVal} />);
      domNode = inputNode();
      return simulateFocus();
    });

    describe('setting an initial value', () => {
      beforeAll(() => {
        initialVal = '12345';
      });

      afterAll(() => {
        initialVal = '';
      });

      it('sets the field value', () => {
        expect(getFieldValue()).toEqual('12/34/5___');
      });

      it('sets the state of the parent component', () => {
        expect(component.state('value')).toEqual('12/34/5___');
      });
    });

    describe('pasting', () => {
      beforeEach(() => {
        simulatePaste('12345');
      });

      it('updates the state of the parent component', () => {
        expect(component.state('value')).toEqual('12/34/5___');
      });
    });

    describe('pressing the backspace key', () => {
      beforeEach(() => {
        simulateTyping('12345');
        simulateKeyDown('Backspace');
      });
      it('updates the state of the parent component', () => {
        expect(component.state('value')).toEqual('12/34/____');
      });
    });
  });

  describe('when the parent component contains multiple inputs', () => {
    const plainInputNode = () => component.find('input').at(0);

    class Parent extends React.Component {
      onChange: React.ChangeEventHandler<HTMLInputElement> = e => {
        // eslint-disable-next-line react/no-unused-state
        this.setState({ value: e.target.value });
      };

      render() {
        return (
          <div>
            <input onChange={this.onChange} />
            <MaskedField id="masked-field" name="masked_field" mask="99-99-9999" />
          </div>
        );
      }
    }

    beforeEach(() => {
      component = render(<Parent />);
      return EventUtils.simulateFocus(plainInputNode());
    });

    describe('when the masked field does not have focus', () => {
      let setSelectionRangeSpy: jest.SpyInstance;

      describe('typing into a sibling input', () => {
        beforeEach(() => {
          const fieldNode = component.find(MaskedField).getDOMNode() as HTMLInputElement;
          setSelectionRangeSpy = jest.spyOn(fieldNode, 'setSelectionRange');
          EventUtils.simulateChange(plainInputNode(), 'hello');
        });

        afterEach(() => {
          setSelectionRangeSpy.mockClear();
        });

        it('does not set the cursor position of the masked field', () => {
          expect(setSelectionRangeSpy).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('changing the value prop directly', () => {
    it('sets the field value correctly', () => {
      component = render(<MaskedField mask="99/99/9999" value="" />);
      expect(getFieldValue()).toEqual('');
      component.setProps({ value: '01012019' });
      expect(getFieldValue()).toEqual('01/01/2019');
    });
  });
});
