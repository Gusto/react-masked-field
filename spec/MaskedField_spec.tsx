/* eslint-disable react/no-multi-comp */

import React from 'react';
import PropTypes from 'prop-types';
import chai from 'chai';
import sinon from 'sinon';
import { mount, configure as configureEnzyme, ReactWrapper } from 'enzyme';
import sinonChai from 'sinon-chai';
import Adapter from 'enzyme-adapter-react-16';
import * as EventUtils from './EventUtils';
import OptionallyMaskedField, { OptionallyMaskedFieldProps } from '../src/index';

configureEnzyme({ adapter: new Adapter() });

const { expect } = chai;
chai.use(sinonChai);

// TODO: Move eslint-config-gusto to public npm

// eslint-disable-next-line no-console
console.error = (message: string) => {
  throw new Error(message);
};

interface TestProps {
  mask?: string;
  value?: string;
  onChange?: sinon.SinonSpy;
  onComplete?: sinon.SinonSpy;
  onKeyDown?: sinon.SinonSpy;
  onKeyPress?: sinon.SinonSpy;
  readOnly?: boolean;
  placeholder?: string;
  translations?: OptionallyMaskedFieldProps['translations'];
}

describe('MaskedField', () => {
  let container: HTMLDivElement;
  let component: ReactWrapper;
  let domNode: HTMLInputElement;
  const props: TestProps = {};

  // FIXME:
  // - undo?

  const getField = () => component.find(OptionallyMaskedField);
  const inputNode = () =>
    getField()
      .find('input')
      .getDOMNode() as HTMLInputElement;
  const getFieldValue = () => inputNode().value;

  function cursorPosShouldEql(pos: number) {
    const node = inputNode();
    expect(node.selectionStart).to.equal(pos);
    expect(node.selectionEnd).to.equal(pos);
  }

  const setSelection = (start: number, end = start) => inputNode().setSelectionRange(start, end);
  const simulateKeyPress = (key: string) => EventUtils.simulateKeyPress(getField(), key);
  const simulateKeyDown = (key: string) => EventUtils.simulateKeyDown(getField(), key);
  const simulatePaste = (content: string) => EventUtils.simulateChange(getField(), content);
  const simulateTyping = (content: string) => EventUtils.simulateTyping(getField(), content);
  const simulateFocus = () => EventUtils.simulateFocus(getField());
  const simulateBlur = () => EventUtils.simulateBlur(getField());

  function render<C extends React.Component, P = C['props'], S = C['state']>(
    element: React.ReactElement<P>,
  ): ReactWrapper<P, S, C> {
    return mount(element, { attachTo: container });
  }

  function setupTests(isControlled: boolean, additionalTests: () => void) {
    context('when the field is focused', () => {
      beforeEach(simulateFocus);

      context("when the mask is '99/99/9999'", () => {
        before(() => {
          props.mask = '99/99/9999';
        });

        additionalTests();

        describe('typing a key', () => {
          before(() => {
            props.onChange = sinon.spy();
            props.onComplete = sinon.spy();
          });

          after(() => {
            delete props.onChange;
            delete props.onComplete;
          });

          beforeEach(() => {
            props.onChange!.reset();
          });

          afterEach(() => {
            props.onChange!.reset();
            props.onComplete!.reset();
          });

          context('the initial cursor position is at a mask index', () => {
            beforeEach(() => {
              setSelection(2, 2);
              simulateKeyPress('2');
            });

            it('inserts at the index after the mask character', () => {
              expect(getFieldValue()).to.equal('__/2_/____');
            });
          });

          context('when the character matches the mask', () => {
            beforeEach(() => {
              simulateKeyPress('2');
            });

            it('adds the character to the value', () => {
              expect(getFieldValue()[0]).to.equal('2');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).to.equal('2_/__/____');
            });

            it('calls the onChange callback', () => {
              expect(props.onChange).to.have.callCount(1);
              expect(props.onChange).to.have.been.calledWithExactly({
                target: {
                  value: '2_/__/____',
                },
              });
            });

            it("doesn't call the onComplete callback", () => {
              expect(props.onComplete).to.have.callCount(0);
            });

            context('when the next character is a mask character', () => {
              beforeEach(() => {
                simulateKeyPress('3');
              });

              it('moves the cursor past the mask character', () => {
                expect(getFieldValue()).to.equal('23/__/____');
                cursorPosShouldEql(3);
              });
            });

            context('when the cursor is in the middle of the value', () => {
              beforeEach(() => {
                simulateTyping('34');
                setSelection(1);
                simulateKeyPress('5');
              });

              it('adds the character to the value', () => {
                expect(getFieldValue()[1]).to.equal('5');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(3);
              });
            });

            context('when the cursor is in the middle an empty field', () => {
              beforeEach(() => {
                setSelection(4);
                simulateKeyPress('5');
              });

              it('adds the character to the value', () => {
                expect(getFieldValue()[4]).to.equal('5');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(6);
              });
            });

            context('when field text is selected', () => {
              beforeEach(() => {
                simulateTyping('345');
                setSelection(1, 5);
                simulateKeyPress('6');
              });

              it('replaces the selected characters', () => {
                expect(getFieldValue().substring(1, 5)).to.equal('6/__');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(3);
              });

              it('correctly shifts the mask characters', () => {
                expect(getFieldValue()).to.equal('26/__/____');
              });

              it('calls the onChange callback', () => {
                expect(props.onChange!.callCount).to.equal(5);
              });
            });

            context('when the entire mask is filled', () => {
              beforeEach(() => {
                simulateTyping('2345678');
              });

              it('calls the onComplete callback', () => {
                expect(props.onComplete).to.have.callCount(1);
                expect(props.onComplete).to.have.been.calledWithExactly('22/34/5678');
              });
            });
          });

          context("when the character doesn't match the mask", () => {
            beforeEach(() => {
              simulateKeyPress('A');
            });

            it("doesn't change the value", () => {
              expect(getFieldValue()).to.equal('__/__/____');
            });

            it("doesn't change the cursor position", () => {
              cursorPosShouldEql(0);
            });

            it("doesn't call the onChange callback", () => {
              expect(props.onChange).to.have.callCount(0);
            });

            context('when the cursor is in the middle of the value', () => {
              beforeEach(() => {
                simulateTyping('123');
                setSelection(1);
                simulateKeyPress('A');
              });

              it("doesn't change the value", () => {
                expect(getFieldValue()).to.equal('12/3_/____');
              });

              it("doesn't change the cursor position", () => {
                cursorPosShouldEql(1);
              });
            });

            context('when field text is selected', () => {
              beforeEach(() => {
                simulateTyping('12345');
                setSelection(1, 5);
                simulateKeyPress('A');
              });

              it('removes the selected characters', () => {
                expect(getFieldValue().substring(1, 5)).to.equal('5/__');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(1);
              });

              it('correctly shifts the mask characters', () => {
                expect(getFieldValue()).to.equal('15/__/____');
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
            expect(getFieldValue()[3]).to.equal('_');
          });

          it('moves the cursor to the correct position', () => {
            cursorPosShouldEql(3);
          });

          it('correctly shifts the mask characters', () => {
            expect(getFieldValue()).to.equal('12/__/____');
          });

          context('when the previous character is a mask character', () => {
            beforeEach(() => {
              simulateKeyDown('Backspace');
            });

            it('removes the preceding non-mask character', () => {
              expect(getFieldValue()[1]).to.equal('_');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).to.equal('1_/__/____');
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

          context('when the next character is a mask character', () => {
            beforeEach(() => {
              simulateKeyPress('3');
              setSelection(2);
              simulateKeyDown('Backspace');
            });

            it('correctly shifts the non-mask characters', () => {
              expect(getFieldValue()).to.equal('13/__/____');
            });
          });

          context('when the cursor is at the beginning', () => {
            beforeEach(() => {
              setSelection(0);
              simulateKeyDown('Backspace');
            });

            it("doesn't change the value", () => {
              expect(getFieldValue()).to.equal('12/__/____');
            });
          });

          context('when field text is selected', () => {
            beforeEach(() => {
              simulateTyping('345');
              setSelection(1, 4);
              simulateKeyDown('Backspace');
            });

            it('removes the selected characters', () => {
              expect(getFieldValue().substring(1, 4)).to.equal('4/5');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).to.equal('14/5_/____');
            });
          });
        });
        describe('pressing the delete key', () => {
          before(() => {
            props.onKeyDown = sinon.spy();
          });

          after(() => {
            delete props.onKeyDown;
          });

          afterEach(() => {
            props.onKeyDown!.reset();
          });

          beforeEach(() => {
            simulateTyping('1234');
            setSelection(1);
            simulateKeyDown('Delete');
          });

          it('removes the following non-mask character', () => {
            expect(getFieldValue()[3]).to.equal('4');
          });

          it("doesn't move the cursor", () => {
            cursorPosShouldEql(1);
          });

          it('correctly shifts the mask characters', () => {
            expect(getFieldValue()).to.equal('13/4_/____');
          });

          it('calls the onKeyDown callback', () => {
            expect(props.onKeyDown).to.have.callCount(1);
          });

          context('when the following character is a mask character', () => {
            beforeEach(() => {
              setSelection(2);
              simulateKeyDown('Delete');
            });

            it('removes the following non-mask character', () => {
              expect(getFieldValue()[3]).to.equal('_');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(3);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).to.equal('13/__/____');
            });
          });

          context('when field text is selected', () => {
            beforeEach(() => {
              simulateTyping('25');
              setSelection(1, 4);
              simulateKeyDown('Delete');
            });

            it('removes the selected characters', () => {
              expect(getFieldValue().substring(1, 4)).to.equal('3/4');
            });

            it("doesn't move the cursor", () => {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).to.equal('13/4_/____');
            });
          });
        });

        describe('pasting', () => {
          context('when the pasted content contains only valid characters', () => {
            before(() => {
              props.onChange = sinon.spy();
              props.onComplete = sinon.spy();
            });

            after(() => {
              delete props.onChange;
              delete props.onComplete;
            });

            beforeEach(() => {
              props.onChange!.reset();
              simulatePaste('12345');
            });

            afterEach(() => {
              props.onChange!.reset();
              props.onComplete!.reset();
            });

            it('adds the content to the value', () => {
              expect(getFieldValue()).to.equal('12/34/5___');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(7);
            });

            it('calls the onChange callback', () => {
              expect(props.onChange).to.have.callCount(1);
              expect(props.onChange).to.have.been.calledWithExactly({
                target: {
                  value: '12/34/5___',
                },
              });
            });

            it("doesn't call the onComplete callback", () => {
              expect(props.onComplete).to.have.callCount(0);
            });

            context('when the entire mask is filled', () => {
              beforeEach(() => {
                simulatePaste('678');
              });

              it('calls the onComplete callback', () => {
                expect(props.onComplete).to.have.callCount(1);
                expect(props.onComplete).to.have.been.calledWithExactly('12/34/5678');
              });
            });

            context('when field text is selected', () => {
              beforeEach(() => {
                setSelection(1, 5);
                simulatePaste('67');
              });

              it('replaces the selected characters', () => {
                expect(getFieldValue().substring(1, 5)).to.equal('6/75');
              });

              // TODO: Is this the right behavior?
              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(4);
              });

              it('correctly shifts the mask characters', () => {
                expect(getFieldValue()).to.equal('16/75/____');
              });
            });
          });

          context('when the pasted content contains invalid characters', () => {
            beforeEach(() => {
              simulateKeyPress('1');
              simulatePaste('2a3b4c5');
            });

            it('adds the valid content to the value', () => {
              expect(getFieldValue()).to.equal('12/34/5___');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(7);
            });

            context('when field text is selected', () => {
              beforeEach(() => {
                setSelection(1, 5);
                simulatePaste('6a7b');
              });

              it('replaces the selected characters', () => {
                expect(getFieldValue().substring(1, 5)).to.equal('6/75');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(4);
              });

              it('correctly shifts the mask characters', () => {
                expect(getFieldValue()).to.equal('16/75/____');
              });
            });
          });
        });

        describe('setting an initial value', () => {
          before(() => {
            props.value = '0101201';
          });

          after(() => {
            delete props.value;
          });

          it('correctly masks the initial value', () => {
            expect(getFieldValue()).to.equal('01/01/201_');
          });

          it('moves the cursor to the correct position', () => {
            cursorPosShouldEql(9);
          });
        });

        describe('blurring', () => {
          context('when the field contains no valid characters', () => {
            beforeEach(simulateBlur);

            it('sets the value to blank', () => {
              expect(getFieldValue()).to.equal('');
            });
          });

          context('when the field contains valid characters', () => {
            beforeEach(() => {
              simulateKeyPress('2');
              simulateBlur();
            });

            it('does not change the value', () => {
              expect(getFieldValue()).to.equal('2_/__/____');
            });
          });

          context('when the field removes all valid characters', () => {
            before(() => {
              props.onChange = sinon.spy();
            });

            beforeEach(() => {
              simulateKeyPress('2');
              simulateKeyDown('Backspace');
              props.onChange!.reset();
              simulateBlur();
            });

            it('sets the value to blank', () => {
              expect(getFieldValue()).to.equal('');
            });

            it('calls the onChange callback', () => {
              expect(props.onChange).to.have.callCount(1);
            });
          });
        });
      });

      context("when the mask is '(999) 999-9999'", () => {
        before(() => {
          props.mask = '(999) 999-9999';
        });

        beforeEach(() => {
          setSelection(9, 9);
          simulateKeyPress('1');
        });

        it('inserts at the index after the mask character', () => {
          expect(getFieldValue()).to.equal('(___) ___-1___');
        });
      });

      context("when the mask is '99//99'", () => {
        before(() => {
          props.mask = '99//99';
        });

        beforeEach(() => {
          setSelection(2, 2);
          simulateKeyPress('1');
        });

        it('inserts at the index after the mask character', () => {
          expect(getFieldValue()).to.equal('__//1_');
        });
      });

      context("when the mask is 'a-99'", () => {
        before(() => {
          props.mask = 'a-99';
        });

        describe('pressing the backspace key', () => {
          beforeEach(() => {
            simulateTyping('a12');
            setSelection(1);
            simulateKeyDown('Backspace');
          });

          it('removes the preceding character', () => {
            expect(getFieldValue()[0]).to.equal('_');
          });

          it('moves the cursor to the correct position', () => {
            cursorPosShouldEql(0);
          });

          it('correctly shifts the mask characters', () => {
            expect(getFieldValue()).to.equal('_-12');
          });
        });
      });

      context("when the mask is 'aaaaaaaa'", () => {
        before(() => {
          props.mask = 'aaaaaaaa';
        });

        it('sets the placeholder correctly', () => {
          expect(domNode.placeholder).to.equal('________');
        });

        describe('pressing the enter key', () => {
          before(() => {
            props.onKeyPress = sinon.spy();
          });

          after(() => {
            delete props.onKeyPress;
          });

          beforeEach(() => {
            simulateKeyPress('Enter');
          });

          afterEach(() => {
            props.onKeyPress!.reset();
          });

          it("doesn't change the value", () => {
            expect(getFieldValue()).to.equal('________');
          });

          it('calls the onKeyPress callback', () => {
            expect(props.onKeyPress).to.have.callCount(1);
          });
        });
      });

      context("when the mask is '21-99999999'", () => {
        before(() => {
          props.mask = '21-99999999';
        });

        describe('initial state', () => {
          it('sets the cursor to the first non-mask character', () => {
            cursorPosShouldEql(3);
          });
        });

        describe('pasting', () => {
          context('when the cursor is at the beginning', () => {
            beforeEach(() => {
              simulatePaste('12345678');
            });

            it('adds the content to the value', () => {
              expect(getFieldValue()).to.equal('21-12345678');
            });
          });
        });

        describe('pressing the backspace key', () => {
          context('when the cursor is after a non-mask character', () => {
            beforeEach(() => {
              simulateKeyDown('Backspace');
            });

            it('moves the cursor to the first non-mask position', () => {
              cursorPosShouldEql(3);
            });
          });

          context('when the entire mask is selected', () => {
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

      context("when the mask is 'ZZ-999-ZZ-999'", () => {
        before(() => {
          props.mask = 'ZZ-999-ZZ-999';
        });

        describe('pasting', () => {
          context('when the cursor is at the beginning', () => {
            beforeEach(() => {
              simulatePaste('123123');
            });

            it('adds the content to the value', () => {
              expect(getFieldValue()).to.equal('ZZ-123-ZZ-123');
            });
          });
        });
      });

      context("when the mask is '036-9999999999-09'", () => {
        before(() => {
          props.mask = '036-9999999999-09';
        });

        describe('typing a key', () => {
          context('when the character matches the mask', () => {
            beforeEach(() => {
              simulateKeyPress('2');
            });

            it('adds the character to the value', () => {
              expect(getFieldValue()[4]).to.equal('2');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(5);
            });

            it('correctly shifts the mask characters', () => {
              expect(getFieldValue()).to.equal('036-2_________-0_');
            });

            context('when the next character is a mask character', () => {
              beforeEach(() => {
                simulateTyping('345678912');
              });

              it('adds the character to the value', () => {
                expect(getFieldValue().substring(5, 14)).to.equal('345678912');
              });

              it('moves the cursor to the correct position', () => {
                cursorPosShouldEql(16);
              });

              it('correctly shifts the mask characters', () => {
                expect(getFieldValue()).to.equal('036-2345678912-0_');
              });
            });
          });
        });
      });

      context('when there is no mask', () => {
        before(() => {
          delete props.mask;
        });

        describe('setting an initial value', () => {
          before(() => {
            props.value = '123abc';
          });

          it('contains the initial value', () => {
            expect(getFieldValue()).to.equal('123abc');
          });
        });

        describe('typing keys', () => {
          before(() => {
            props.value = '';
          });

          beforeEach(() => {
            props.onChange!.reset();
            simulateTyping('1a2b3c');
          });

          it('calls the onChange prop', () => {
            expect(props.onChange).to.have.callCount(6);
          });

          if (isControlled) {
            it('adds the characters to the value', () => {
              expect(getFieldValue()).to.equal('1a2b3c');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(6);
            });
          }
        });
      });

      context('when there is a pattern provided', () => {
        before(() => {
          props.mask = 'FFF';
          props.translations = {
            F: /[F]/,
          };
        });

        describe('typing a key', () => {
          context('when the character matches the mask', () => {
            beforeEach(() => {
              simulateKeyPress('F');
            });

            it('adds the character to the value', () => {
              expect(getFieldValue()[0]).to.equal('F');
            });

            it('moves the cursor to the correct position', () => {
              cursorPosShouldEql(1);
            });
          });

          context("when the character doesn't match the mask", () => {
            beforeEach(() => {
              simulateKeyPress('A');
            });

            it("doesn't change the value", () => {
              expect(getFieldValue()).to.equal('___');
            });

            it("doesn't change the cursor position", () => {
              cursorPosShouldEql(0);
            });
          });
        });
      });
    });
  }

  before(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    component.detach();
  });

  context("when the component isn't controlled", () => {
    before(() => {
      delete props.value;
    });

    beforeEach(() => {
      if (props.value && !props.onChange) {
        props.readOnly = true;
      }
      component = render(<OptionallyMaskedField {...props} />);
      domNode = inputNode();
    });

    afterEach(() => {
      delete props.readOnly;
    });

    setupTests(false, () => {
      describe('the placeholder', () => {
        context('when a placeholder is given', () => {
          before(() => {
            props.placeholder = 'mm/dd/yyyy';
          });

          after(() => {
            delete props.placeholder;
          });

          it('fills in the placeholder with the provided characters', () => {
            expect(domNode.placeholder).to.equal('mm/dd/yyyy');
          });
        });

        context('when no placeholder is given', () => {
          it('fills in the placeholder with the default character', () => {
            expect(domNode.placeholder).to.equal('__/__/____');
          });
        });
      });
    });

    context('when the field is not focused', () => {
      before(() => {
        props.mask = '99/99/9999';
      });

      it('has a blank value', () => {
        expect(getFieldValue()).to.equal('');
      });
    });
  });

  context('when the component is controlled', () => {
    class ControlledWrapper extends React.Component<OptionallyMaskedFieldProps> {
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

      handleChange: OptionallyMaskedFieldProps['onChange'] = e => {
        const { onChange } = this.props;
        if (onChange) {
          onChange({ target: { value: e.target.value } });
        }
        this.setState({ value: e.target.value });
      };

      render() {
        const { value } = this.state;
        return <OptionallyMaskedField {...this.props} value={value} onChange={this.handleChange} />;
      }
    }

    before(() => {
      props.value = '';
    });

    beforeEach(() => {
      component = render(<ControlledWrapper {...props} />);
      domNode = inputNode();
    });

    setupTests(true, () => {
      describe('initial render', () => {
        before(() => {
          props.onChange = sinon.spy();
        });

        after(() => {
          delete props.onChange;
        });

        afterEach(() => {
          props.onChange!.reset();
        });

        context('when the initial value is blank', () => {
          it('does not call the onChange callback', () => {
            expect(props.onChange).to.have.callCount(0);
          });
        });

        context('when the initial value matches the placeholder', () => {
          before(() => {
            props.value = '__/__/____';
          });

          after(() => {
            props.value = '';
          });

          it('does not call the onChange callback', () => {
            expect(props.onChange).to.have.callCount(0);
          });
        });

        context("when the initial value doesn't change when masked", () => {
          before(() => {
            props.value = '1_/__/____';
          });

          after(() => {
            props.value = '';
          });

          it('does not call the onChange callback', () => {
            expect(props.onChange).to.have.callCount(0);
          });
        });
      });
    });
  });

  context('when the component uses ReactLink', () => {
    let initialVal = '';

    interface LinkWrapperProps extends OptionallyMaskedFieldProps {
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
        return <OptionallyMaskedField {...this.props} valueLink={valueLink} />;
      }
    }

    beforeEach(() => {
      component = render(<LinkWrapper mask="99/99/9999" value={initialVal} />);
      domNode = inputNode();
      return simulateFocus();
    });

    describe('setting an initial value', () => {
      before(() => {
        initialVal = '12345';
      });

      after(() => {
        initialVal = '';
      });

      it('sets the field value', () => {
        expect(getFieldValue()).to.equal('12/34/5___');
      });

      it('sets the state of the parent component', () => {
        expect(component.state('value')).to.equal('12/34/5___');
      });
    });

    describe('pasting', () => {
      beforeEach(() => {
        simulatePaste('12345');
      });

      it('updates the state of the parent component', () => {
        expect(component.state('value')).to.equal('12/34/5___');
      });
    });

    describe('pressing the backspace key', () => {
      beforeEach(() => {
        simulateTyping('12345');
        simulateKeyDown('Backspace');
      });
      it('updates the state of the parent component', () => {
        expect(component.state('value')).to.equal('12/34/____');
      });
    });
  });

  context('when the parent component contains multiple inputs', () => {
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
            <OptionallyMaskedField mask="99-99-9999" />
          </div>
        );
      }
    }

    beforeEach(() => {
      component = render(<Parent />);
      return EventUtils.simulateFocus(plainInputNode());
    });

    context('when the masked field does not have focus', () => {
      interface SpiedHTMLInputElement extends HTMLInputElement {
        setSelectionRange: sinon.SinonSpy;
      }
      let fieldNode: SpiedHTMLInputElement;

      describe('typing into a sibling input', () => {
        beforeEach(() => {
          fieldNode = component.find(OptionallyMaskedField).getDOMNode() as SpiedHTMLInputElement;
          sinon.spy(fieldNode, 'setSelectionRange');
          EventUtils.simulateChange(plainInputNode(), 'hello');
        });

        afterEach(() => {
          fieldNode.setSelectionRange.restore();
        });

        it('does not set the cursor position of the masked field', () => {
          expect(fieldNode.setSelectionRange).to.have.callCount(0);
        });
      });
    });
  });
});
