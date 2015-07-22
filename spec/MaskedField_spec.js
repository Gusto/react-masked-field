'use strict';

const React = require('react');
const TestUtils = require('react/lib/ReactTestUtils');
const LinkedStateMixin = require('react/lib/LinkedStateMixin');
const MaskedField = require('../src/MaskedField');
const EventUtils = require('./EventUtils');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

describe('MaskedField', function() {
  let container;
  let component;
  let domNode;
  let getField;
  const props = {};

  // FIXME:
  // - undo?

  function getFieldValue() {
    return TestUtils.findRenderedDOMComponentWithTag(getField(), 'input').getDOMNode().value;
  }

  function cursorPosShouldEql(pos) {
    expect(getField()._getSelection()).to.eql({start: pos, end: pos});
  }

  const simulateKeyPress = key => EventUtils.simulateKeyPress(domNode, key);
  const simulateKeyDown = key => EventUtils.simulateKeyDown(domNode, key);
  const simulatePaste = content => EventUtils.simulateChange(domNode, content);
  const simulateTyping = content => EventUtils.simulateTyping(domNode, content);
  const simulateFocus = cb => EventUtils.simulateFocus(domNode, cb);
  const simulateBlur = () => EventUtils.simulateBlur(domNode);

  function setupTests(additionalTests) {
    context('when the field is focused', function() {
      beforeEach(function(done) {
        simulateFocus(done);
      });

      context("when the mask is '99/99/9999'", function() {
        before(function() {
          props.mask = '99/99/9999';
        });

        additionalTests();

        describe('typing a key', function() {
          before(function() {
            props.onChange = sinon.spy();
            props.onComplete = sinon.spy();
          });

          after(function() {
            delete props.onChange;
            delete props.onComplete;
          });

          beforeEach(function() {
            props.onChange.reset();
          });

          afterEach(function() {
            props.onChange.reset();
            props.onComplete.reset();
          });

          context('when the character matches the mask', function() {
            beforeEach(function() {
              simulateKeyPress('2');
            });

            it('adds the character to the value', function() {
              expect(getFieldValue()[0]).to.equal('2');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', function() {
              expect(getFieldValue()).to.equal('2_/__/____');
            });

            it('calls the onChange callback', function() {
              expect(props.onChange).to.have.been.calledOnce;
              expect(props.onChange).to.have.been.calledWithExactly({
                target: {
                  value: '2_/__/____'
                }
              });
            });

            it("doesn't call the onComplete callback", function() {
              expect(props.onComplete).to.have.not.been.called;
            });

            context('when the next character is a mask character', function() {
              beforeEach(function() {
                simulateKeyPress('3');
              });

              it('moves the cursor past the mask character', function() {
                expect(getFieldValue()).to.equal('23/__/____');
                cursorPosShouldEql(3);
              });
            });

            context('when the cursor is in the middle of the value', function() {
              beforeEach(function() {
                simulateTyping('34');
                getField()._setSelection(1);
                simulateKeyPress('5');
              });

              it('adds the character to the value', function() {
                expect(getFieldValue()[1]).to.equal('5');
              });

              it('moves the cursor to the correct position', function() {
                cursorPosShouldEql(3);
              });
            });

            context('when the cursor is in the middle an empty field', function() {
              beforeEach(function() {
                getField()._setSelection(4);
                simulateKeyPress('5');
              });

              it('adds the character to the value', function() {
                expect(getFieldValue()[4]).to.equal('5');
              });

              it('moves the cursor to the correct position', function() {
                cursorPosShouldEql(6);
              });
            });

            context('when field text is selected', function() {
              beforeEach(function() {
                simulateTyping('345');
                getField()._setSelection(1, 5);
                simulateKeyPress('6');
              });

              it('replaces the selected characters', function() {
                expect(getFieldValue().substring(1, 5)).to.equal('6/__');
              });

              it('moves the cursor to the correct position', function() {
                cursorPosShouldEql(3);
              });

              it('correctly shifts the mask characters', function() {
                expect(getFieldValue()).to.equal('26/__/____');
              });

              it('calls the onChange callback', function() {
                expect(props.onChange.callCount).to.equal(5);
              });
            });

            context('when the entire mask is filled', function() {
              beforeEach(function() {
                simulateTyping('2345678');
              });

              it('calls the onComplete callback', function() {
                expect(props.onComplete).to.have.been.calledOnce;
                expect(props.onComplete).to.have.been.calledWithExactly('22/34/5678');
              });
            });
          });

          context("when the character doesn't match the mask", function() {
            beforeEach(function() {
              simulateKeyPress('A');
            });

            it("doesn't change the value", function() {
              expect(getFieldValue()).to.equal('__/__/____');
            });

            it("doesn't change the cursor position", function() {
              cursorPosShouldEql(0);
            });

            it("doesn't call the onChange callback", function() {
              expect(props.onChange).to.have.not.been.called;
            });

            context('when the cursor is in the middle of the value', function() {
              beforeEach(function() {
                simulateTyping('123');
                getField()._setSelection(1);
                simulateKeyPress('A');
              });

              it("doesn't change the value", function() {
                expect(getFieldValue()).to.equal('12/3_/____');
              });

              it("doesn't change the cursor position", function() {
                cursorPosShouldEql(1);
              });
            });

            context('when field text is selected', function() {
              beforeEach(function() {
                simulateTyping('12345');
                getField()._setSelection(1, 5);
                simulateKeyPress('A');
              });

              it('removes the selected characters', function() {
                expect(getFieldValue().substring(1, 5)).to.equal('5/__');
              });

              it('moves the cursor to the correct position', function() {
                cursorPosShouldEql(1);
              });

              it('correctly shifts the mask characters', function() {
                expect(getFieldValue()).to.equal('15/__/____');
              });
            });
          });
        });

        describe('pressing the backspace key', function() {
          beforeEach(function() {
            simulateTyping('123');
            simulateKeyDown('Backspace');
          });

          it('removes the preceding character', function() {
            expect(getFieldValue()[3]).to.equal('_');
          });

          it('moves the cursor to the correct position', function() {
            cursorPosShouldEql(3);
          });

          it('correctly shifts the mask characters', function() {
            expect(getFieldValue()).to.equal('12/__/____');
          });

          context('when the previous character is a mask character', function() {
            beforeEach(function() {
              simulateKeyDown('Backspace');
            });

            it('removes the preceding non-mask character', function() {
              expect(getFieldValue()[1]).to.equal('_');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', function() {
              expect(getFieldValue()).to.equal('1_/__/____');
            });

            describe('typing another character', function() {
              beforeEach(function() {
                simulateKeyPress('1');
              });

              it('moves the cursor to the correct position', function() {
                cursorPosShouldEql(3);
              });
            });
          });

          context('when the next character is a mask character', function() {
            beforeEach(function() {
              simulateKeyPress('3');
              getField()._setSelection(2);
              simulateKeyDown('Backspace');
            });

            it('correctly shifts the non-mask characters', function() {
              expect(getFieldValue()).to.equal('13/__/____');
            });
          });

          context('when the cursor is at the beginning', function() {
            beforeEach(function() {
              getField()._setSelection(0);
              simulateKeyDown('Backspace');
            });

            it("doesn't change the value", function() {
              expect(getFieldValue()).to.equal('12/__/____');
            });
          });

          context('when field text is selected', function() {
            beforeEach(function() {
              simulateTyping('345');
              getField()._setSelection(1, 4);
              simulateKeyDown('Backspace');
            });

            it('removes the selected characters', function() {
              expect(getFieldValue().substring(1, 4)).to.equal('4/5');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', function() {
              expect(getFieldValue()).to.equal('14/5_/____');
            });
          });
        });
        describe('pressing the delete key', function() {
          before(function() {
            props.onKeyDown = sinon.spy();
          });

          after(function() {
            delete props.onKeyDown;
          });

          afterEach(function() {
            props.onKeyDown.reset();
          });

          beforeEach(function() {
            simulateTyping('1234');
            getField()._setSelection(1);
            simulateKeyDown('Delete');
          });

          it('removes the following non-mask character', function() {
            expect(getFieldValue()[3]).to.equal('4');
          });

          it("doesn't move the cursor", function() {
            cursorPosShouldEql(1);
          });

          it('correctly shifts the mask characters', function() {
            expect(getFieldValue()).to.equal('13/4_/____');
          });

          it('calls the onKeyDown callback', function() {
            expect(props.onKeyDown).to.have.been.calledOnce;
          });

          context('when the following character is a mask character', function() {
            beforeEach(function() {
              getField()._setSelection(2);
              simulateKeyDown('Delete');
            });

            it('removes the following non-mask character', function() {
              expect(getFieldValue()[3]).to.equal('_');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(3);
            });

            it('correctly shifts the mask characters', function() {
              expect(getFieldValue()).to.equal('13/__/____');
            });
          });

           context('when field text is selected', function() {
            beforeEach(function() {
              simulateTyping('25');
              getField()._setSelection(1, 4);
              simulateKeyDown('Delete');
            });

            it('removes the selected characters', function() {
              expect(getFieldValue().substring(1, 4)).to.equal('3/4');
            });

            it("doesn't move the cursor", function() {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', function() {
              expect(getFieldValue()).to.equal('13/4_/____');
            });
          });
        });

        describe('pasting', function() {
          context('when the pasted content contains only valid characters', function() {
            before(function() {
              props.onChange = sinon.spy();
              props.onComplete = sinon.spy();
            });

            after(function() {
              delete props.onChange;
              delete props.onComplete;
            });

            beforeEach(function() {
              props.onChange.reset();
              simulatePaste('12345');
            });

            afterEach(function() {
              props.onChange.reset();
              props.onComplete.reset();
            });

            it('adds the content to the value', function() {
              expect(getFieldValue()).to.equal('12/34/5___');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(7);
            });

            it('calls the onChange callback', function() {
              expect(props.onChange).to.have.been.calledOnce;
              expect(props.onChange).to.have.been.calledWithExactly({
                target: {
                  value: '12/34/5___'
                }
              });
            });

            it("doesn't call the onComplete callback", function() {
              expect(props.onComplete).to.have.not.been.called;
            });

            context('when the entire mask is filled', function() {
              beforeEach(function() {
                simulatePaste('678');
              });

              it('calls the onComplete callback', function() {
                expect(props.onComplete).to.have.been.calledOnce;
                expect(props.onComplete).to.have.been.calledWithExactly('12/34/5678');
              });
            });

            context('when field text is selected', function() {
              beforeEach(function() {
                getField()._setSelection(1, 5);
                simulatePaste('67');
              });

              it('replaces the selected characters', function() {
                expect(getFieldValue().substring(1, 5)).to.equal('6/75');
              });

              // TODO: Is this the right behavior?
              it('moves the cursor to the correct position', function() {
                cursorPosShouldEql(4);
              });

              it('correctly shifts the mask characters', function() {
                expect(getFieldValue()).to.equal('16/75/____');
              });

            });
          });

          context('when the pasted content contains invalid characters', function() {
            beforeEach(function() {
              simulateKeyPress('1');
              simulatePaste('2a3b4c5');
            });

            it('adds the valid content to the value', function() {
              expect(getFieldValue()).to.equal('12/34/5___');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(7);
            });

            context('when field text is selected', function() {
              beforeEach(function() {
                getField()._setSelection(1, 5);
                simulatePaste('6a7b');
              });

              it('replaces the selected characters', function() {
                expect(getFieldValue().substring(1, 5)).to.equal('6/75');
              });

              it('moves the cursor to the correct position', function() {
                cursorPosShouldEql(4);
              });

              it('correctly shifts the mask characters', function() {
                expect(getFieldValue()).to.equal('16/75/____');
              });
            });
          });
        });

        describe('setting an initial value', function() {
          before(function() {
            props.value = '0101201';
          });

          after(function() {
            delete props.value;
          });

          it('correctly masks the initial value', function() {
            expect(getFieldValue()).to.equal('01/01/201_');
          });

          it('moves the cursor to the correct position', function() {
            cursorPosShouldEql(9);
          });
        });

        describe('blurring', function() {
          context('when the field contains no valid characters', function () {
            beforeEach(function() {
              simulateBlur();
            });

            it('sets the value to blank', function () {
              expect(getFieldValue()).to.equal('');
            });
          });


          context('when the field contains valid characters', function () {
            beforeEach(function() {
              simulateKeyPress('2');
              simulateBlur();
            });

            it('does not change the value', function() {
              expect(getFieldValue()).to.equal('2_/__/____');
            });
          });

          context('when the field removes all valid characters', function() {
            before(function() {
              props.onChange = sinon.spy();
            });

            beforeEach(function() {
              simulateKeyPress('2');
              simulateKeyDown('Backspace');
              props.onChange.reset();
              simulateBlur();
            });

            it('sets the value to blank', function () {
              expect(getFieldValue()).to.equal('');
            });

            it('calls the onChange callback', function() {
              expect(props.onChange).to.have.been.calledOnce;
            });
          });
        });
      });

      context("when the mask is 'a-99'", function() {
        before(function() {
          props.mask = 'a-99';
        });

        describe('pressing the backspace key', function() {
          beforeEach(function() {
            simulateTyping('a12');
            getField()._setSelection(1);
            simulateKeyDown('Backspace');
          });

          it('removes the preceding character', function() {
            expect(getFieldValue()[0]).to.equal('_');
          });

          it('moves the cursor to the correct position', function() {
            cursorPosShouldEql(0);
          });

          it('correctly shifts the mask characters', function() {
            expect(getFieldValue()).to.equal('_-12');
          });
        });
      });

      context("when the mask is 'aaaaaaaa'", function() {
        before(function() {
          props.mask = 'aaaaaaaa';
        });

        it('sets the placeholder correctly', function() {
          expect(domNode.placeholder).to.equal('________');
        });

        describe('pressing the enter key', function() {
          before(function() {
            props.onKeyPress = sinon.spy();
          });

          after(function() {
            delete props.onKeyPress;
          });

          beforeEach(function() {
            simulateKeyPress('Enter');
          });

          afterEach(function() {
            props.onKeyPress.reset();
          });

          it("doesn't change the value", function() {
            expect(getFieldValue()).to.equal('________');
          });

          it('calls the onKeyPress callback', function() {
            expect(props.onKeyPress).to.have.been.calledOnce;
          });
        });
      });

      context("when the mask is '21-99999999'", function() {
        before(function() {
          props.mask = '21-99999999';
        });

        describe('initial state', function() {
          it('sets the cursor to the first non-mask character', function() {
            cursorPosShouldEql(3);
          });
        });

        describe('pasting', function() {
          context('when the cursor is at the beginning', function() {
            beforeEach(function() {
              simulatePaste('12345678');
            });

            it('adds the content to the value', function() {
              expect(getFieldValue()).to.equal('21-12345678');
            });
          });
        });

        describe('pressing the backspace key', function() {
          context('when the cursor is after a non-mask character', function() {
            beforeEach(function() {
              simulateKeyDown('Backspace');
            });

            it('moves the cursor to the first non-mask position', function() {
              cursorPosShouldEql(3);
            });
          });


          context('when the entire mask is selected', function() {
            beforeEach(function() {
              getField()._setSelection(0, 11);
              simulateKeyDown('Backspace');
            });

            it('moves the cursor to the first non-mask position', function() {
              cursorPosShouldEql(3);
            });
          });
        });
      });

      context("when the mask is 'ZZ-999-ZZ-999'", function() {
        before(function() {
          props.mask = 'ZZ-999-ZZ-999';
        });

        describe('pasting', function() {
          context('when the cursor is at the beginning', function() {
            beforeEach(function() {
              simulatePaste('123123');
            });

            it('adds the content to the value', function() {
              expect(getFieldValue()).to.equal('ZZ-123-ZZ-123');
            });
          });
        });
      });

      context("when the mask is '036-9999999999-09'", function() {
        before(function() {
          props.mask = '036-9999999999-09';
        });

        describe('typing a key', function () {
          context('when the character matches the mask', function() {
            beforeEach(function() {
              simulateKeyPress('2');
            });

            it('adds the character to the value', function() {
              expect(getFieldValue()[4]).to.equal('2');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(5);
            });

            it('correctly shifts the mask characters', function() {
              expect(getFieldValue()).to.equal('036-2_________-0_');
            });

            context('when the next character is a mask character', function () {
              beforeEach(function () {
                simulateTyping('345678912');
              });

              it('adds the character to the value', function() {
                expect(getFieldValue().substring(5, 14)).to.equal('345678912');
              });

              it('moves the cursor to the correct position', function() {
                cursorPosShouldEql(16);
              });

              it('correctly shifts the mask characters', function() {
                expect(getFieldValue()).to.equal('036-2345678912-0_');
              });
            });
          });
        });
      });

      context('when there is no mask', function() {
        before(function() {
          delete props.mask;
        });

        describe('setting an initial value', function() {
          before(function() {
            props.value = '123abc';
          });

          after(function() {
            delete props.value;
          });

          it('contains the initial value', function() {
            expect(getFieldValue()).to.equal('123abc');
          });
        });

        describe('typing keys', function() {
          beforeEach(function() {
            simulateTyping('1a2b3c');
          });

          it('adds the characters to the value', function() {
            expect(getFieldValue()).to.equal('1a2b3c');
          });

          it('moves the cursor to the correct position', function() {
            cursorPosShouldEql(6);
          });
        });
      });

      context('when there is a pattern provided', function() {
        before(function() {
          props.mask = 'FFF';
          props.translations = {
            'F': /[F]/
          };
        });

        describe('typing a key', function() {
          context('when the character matches the mask', function() {
            beforeEach(function() {
              simulateKeyPress('F');
            });

            it('adds the character to the value', function() {
              expect(getFieldValue()[0]).to.equal('F');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(1);
            });
          });

          context("when the character doesn't match the mask", function() {
            beforeEach(function() {
              simulateKeyPress('A');
            });

            it("doesn't change the value", function() {
              expect(getFieldValue()).to.equal('___');
            });

            it("doesn't change the cursor position", function() {
              cursorPosShouldEql(0);
            });
          });
        });
      });
    });
  }

  beforeEach(function() {
    if (container != null) {
      document.body.removeChild(container);
    }

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  context("when the component isn't controlled", function() {
    before(function() {
      delete props.value;
      getField = () => component;
    });

    beforeEach(function() {
      if (props.value != null && props.onChange == null) {
        props.readOnly = true;
      }
      component = React.render(<MaskedField {...props} />, container);
      domNode = component.getDOMNode();
    });

    afterEach(function() {
      delete props.readOnly;
    });

    setupTests(function() {
      describe('the placeholder', function() {
        context('when a placeholder is given', function() {
          before(function() {
            props.placeholder = 'mm/dd/yyyy';
          });

          after(function() {
            delete props.placeholder;
          });

          it('fills in the placeholder with the provided characters', function() {
            expect(domNode.placeholder).to.equal('mm/dd/yyyy');
          });
        });

        context('when no placeholder is given', function() {
          it('fills in the placeholder with the default character', function() {
            expect(domNode.placeholder).to.equal('__/__/____');
          });
        });
      });
    });

    context('when the field is not focused', function() {
      before(function() {
        props.mask = '99/99/9999';
      });

      it('has a blank value', function() {
        expect(getFieldValue()).to.equal('');
      });
    });
  });

  context('when the component is controlled', function() {
    const ControlledWrapper = React.createClass({
      propTypes: {
        value: React.PropTypes.string,
        onChange: React.PropTypes.func
      },
      getInitialState() {
        return {
          value: this.props.value
        };
      },
      handleChange(e) {
        if (this.props.onChange) {
          this.props.onChange({target: {value: e.target.value}});
        }
        this.setState({value: e.target.value});
      },
      render() {
        return (
          <MaskedField
            {...this.props}
            value={this.state.value}
            onChange={this.handleChange}
            ref="field"
          />
        );
      }
    });

    before(function() {
      props.value = '';
      getField = () => component.refs.field;
    });

    beforeEach(function() {
      component = React.render(<ControlledWrapper {...props} />, container);
      domNode = component.getDOMNode();
    });

    setupTests(function() {
      describe('initial render', function() {
        before(function() {
          props.onChange = sinon.spy();
        });

        after(function() {
          delete props.onChange;
        });

        afterEach(function() {
          props.onChange.reset();
        });

        context('when the initial value is blank', function() {
          it('does not call the onChange callback', function() {
            expect(props.onChange).to.have.not.been.called;
          });
        });

        context('when the initial value matches the placeholder', function() {
          before(function() {
            props.value = '__/__/____';
          });

          after(function() {
            props.value = '';
          });

          it('does not call the onChange callback', function() {
            expect(props.onChange).to.have.not.been.called;
          });
        });

        context("when the initial value doesn't change when masked", function() {
          before(function() {
            props.value = '1_/__/____';
          });

          after(function() {
            props.value = '';
          });

          it('does not call the onChange callback', function() {
            expect(props.onChange).to.have.not.been.called;
          });
        });
      });
    });
  });

  context('when the component uses ReactLink', function() {
    let value = '';

    const LinkWrapper = React.createClass({
      propTypes: {value: React.PropTypes.string},
      mixins: [LinkedStateMixin],
      getInitialState() {
        return {value: this.props.value};
      },
      render() {
        return <MaskedField {...this.props} valueLink={this.linkState('value')} ref="field" />;
      }
    });

    before(function() {
      getField = () => component.refs.field;
    });

    beforeEach(function() {
      component = React.render(
        <LinkWrapper mask="99/99/9999" value={value} />,
        container
      );
      domNode = component.getDOMNode();
    });

    describe('setting an initial value', function() {
      before(function() {
        value = '12345';
      });

      after(function() {
        value = '';
      });

      it('sets the field value', function() {
        expect(getFieldValue()).to.equal('12/34/5___');
      });

      it('sets the state of the parent component', function() {
        expect(component.state.value).to.equal('12/34/5___');
      });
    });

    describe('pasting', function() {
      beforeEach(function() {
        simulatePaste('12345');
      });

      it('updates the state of the parent component', function() {
        expect(component.state.value).to.equal('12/34/5___');
      });
    });

    describe('pressing the backspace key', function() {
      beforeEach(function() {
        simulateTyping('12345');
        simulateKeyDown('Backspace');
      });
      it('updates the state of the parent component', function() {
        expect(component.state.value).to.equal('12/34/____');
      });
    });
  });
});
