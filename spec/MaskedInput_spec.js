'use strict';

var React = require('react');
var TestUtils = require('react/lib/ReactTestUtils');
var LinkedStateMixin = require('react/lib/LinkedStateMixin');
var MaskedInput = require('../src/MaskedInput');
var EventUtils = require('./EventUtils');
var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
chai.use(require('sinon-chai'));

describe('MaskedInput', function() {
  var container;
  var mask;
  var component;
  var domNode;
  var initialVal;
  var getInput;
  var format;
  var translations;

  var handleChange;
  var handleKeyDown;
  var handleKeyPress;
  var handleComplete;

  // FIXME:
  // - undo?

  // TODO:
  // - When to show the placeholder
  // - Should the cursor be set to the first non-mask char?

  function getInputValue() {
    return TestUtils.findRenderedDOMComponentWithTag(getInput(), 'input').getDOMNode().value;
  }

  function cursorPosShouldEql(pos) {
    expect(getInput()._getSelection()).to.eql({start: pos, end: pos});
  }

  function simulateFocus(cb) {
    TestUtils.Simulate.focus(domNode);
    setTimeout(cb, 0);
  }

  var simulateKeyPress = key => EventUtils.simulateKeyPress(domNode, key);
  var simulateKeyDown = key => EventUtils.simulateKeyDown(domNode, key);
  var simulatePaste = content => EventUtils.simulateChange(domNode, content);
  var simulateTyping = content => EventUtils.simulateTyping(domNode, content);

  function setupTests(additionalTests) {
    context("when the mask is '99/99/9999'", function() {
      before(function() {
        mask = '99/99/9999';
      });

      additionalTests();

      describe('typing a key', function() {
        before(function() {
          handleChange = sinon.spy();
          handleComplete = sinon.spy();
        });

        after(function() {
          handleChange = null;
          handleComplete = null;
        });

        beforeEach(function() {
          handleChange.reset();
        });

        afterEach(function() {
          handleChange.reset();
          handleComplete.reset();
        });

        context('when the character matches the mask', function() {
          beforeEach(function() {
            simulateKeyPress('2');
          });

          it('adds the character to the value', function() {
            expect(getInputValue()[0]).to.equal('2');
          });

          it('moves the cursor to the correct position', function() {
            cursorPosShouldEql(1);
          });

          it('correctly shifts the mask characters', function() {
            expect(getInputValue()).to.equal('2_/__/____');
          });

          it('calls the onChange callback', function() {
            expect(handleChange).to.have.been.calledOnce;
            expect(handleChange).to.have.been.calledWithExactly({
              target: {
                value: '2_/__/____'
              }
            });
          });

          it("doesn't call the onComplete callback", function() {
            expect(handleComplete).to.have.not.been.called;
          });

          context('when the next character is a mask character', function() {
            // TODO: be?
            it('moves the cursor past the mask character', function() {
              simulateKeyPress('3');
              expect(getInputValue()).to.equal('23/__/____');
              cursorPosShouldEql(3);
            });
          });

          context('when the cursor is in the middle of the value', function() {
            beforeEach(function() {
              simulateTyping('34');
              getInput()._setSelection(1);
              simulateKeyPress('5');
            });

            it('adds the character to the value', function() {
              expect(getInputValue()[1]).to.equal('5');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(3);
            });
          });

          context('when input text is selected', function() {
            beforeEach(function() {
              simulateTyping('345');
              getInput()._setSelection(1, 5);
              simulateKeyPress('6');
            });

            it('replaces the selected characters', function() {
              expect(getInputValue().substring(1, 5)).to.equal('6/__');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(3);
            });

            it('correctly shifts the mask characters', function() {
              expect(getInputValue()).to.equal('26/__/____');
            });

            it('calls the onChange callback', function() {
              expect(handleChange.callCount).to.equal(5);
            });
          });

          context('when the entire mask is filled', function() {
            beforeEach(function() {
              simulateTyping('2345678');
            });

            it('calls the onComplete callback', function() {
              expect(handleComplete).to.have.been.calledOnce;
              expect(handleComplete).to.have.been.calledWithExactly('22/34/5678');
            });
          });
        });

        context("when the character doesn't match the mask", function() {
          beforeEach(function() {
            simulateKeyPress('A');
          });

          it("doesn't change the value", function() {
            expect(getInputValue()).to.equal('__/__/____');
          });

          it("doesn't change the cursor position", function() {
            cursorPosShouldEql(0);
          });

          it("doesn't call the onChange callback", function() {
            expect(handleChange).to.have.not.been.called;
          });

          context('when the cursor is in the middle of the value', function() {
            beforeEach(function() {
              simulateTyping('123');
              getInput()._setSelection(1);
              simulateKeyPress('A');
            });

            it("doesn't change the value", function() {
              expect(getInputValue()).to.equal('12/3_/____');
            });

            it("doesn't change the cursor position", function() {
              cursorPosShouldEql(1);
            });
          });

          context('when input text is selected', function() {
            beforeEach(function() {
              simulateTyping('12345');
              getInput()._setSelection(1, 5);
              simulateKeyPress('A');
            });

            it('removes the selected characters', function() {
              expect(getInputValue().substring(1, 5)).to.equal('5/__');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(1);
            });

            it('correctly shifts the mask characters', function() {
              expect(getInputValue()).to.equal('15/__/____');
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
          expect(getInputValue()[3]).to.equal('_');
        });

        it('moves the cursor to the correct position', function() {
          cursorPosShouldEql(3);
        });

        it('correctly shifts the mask characters', function() {
          expect(getInputValue()).to.equal('12/__/____');
        });

        context('when the previous character is a mask character', function() {
          beforeEach(function() {
            simulateKeyDown('Backspace');
          });

          it('removes the preceding non-mask character', function() {
            expect(getInputValue()[1]).to.equal('_');
          });

          it('moves the cursor to the correct position', function() {
            cursorPosShouldEql(1);
          });

          it('correctly shifts the mask characters', function() {
            expect(getInputValue()).to.equal('1_/__/____');
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
            getInput()._setSelection(2);
            simulateKeyDown('Backspace');
          });

          it('correctly shifts the non-mask characters', function() {
            expect(getInputValue()).to.equal('13/__/____');
          });
        });

        context('when the cursor is at the beginning', function() {
          beforeEach(function() {
            getInput()._setSelection(0);
            simulateKeyDown('Backspace');
          });

          it("doesn't change the value", function() {
            expect(getInputValue()).to.equal('12/__/____');
          });
        });

        context('when input text is selected', function() {
          beforeEach(function() {
            simulateTyping('345');
            getInput()._setSelection(1, 4);
            simulateKeyDown('Backspace');
          });

          it('removes the selected characters', function() {
            expect(getInputValue().substring(1, 4)).to.equal('4/5');
          });

          it('moves the cursor to the correct position', function() {
            cursorPosShouldEql(1);
          });

          it('correctly shifts the mask characters', function() {
            expect(getInputValue()).to.equal('14/5_/____');
          });
        });
      });
      describe('pressing the delete key', function() {
        before(function() {
          handleKeyDown = sinon.spy();
        });

        after(function() {
          handleKeyDown = null;
        });

        afterEach(function() {
          handleKeyDown.reset();
        });

        beforeEach(function() {
          simulateTyping('1234');
          getInput()._setSelection(1);
          simulateKeyDown('Delete');
        });

        it('removes the following non-mask character', function() {
          expect(getInputValue()[3]).to.equal('4');
        });

        it("doesn't move the cursor", function() {
          cursorPosShouldEql(1);
        });

        it('correctly shifts the mask characters', function() {
          expect(getInputValue()).to.equal('13/4_/____');
        });

        it('calls the onKeyDown callback', function() {
          expect(handleKeyDown).to.have.been.calledOnce;
        });

        context('when the following character is a mask character', function() {
          beforeEach(function() {
            getInput()._setSelection(2);
            simulateKeyDown('Delete');
          });

          it('removes the following non-mask character', function() {
            expect(getInputValue()[3]).to.equal('_');
          });

          it('moves the cursor to the correct position', function() {
            cursorPosShouldEql(3);
          });

          it('correctly shifts the mask characters', function() {
            expect(getInputValue()).to.equal('13/__/____');
          });
        });

         context('when input text is selected', function() {
          beforeEach(function() {
            simulateTyping('25');
            getInput()._setSelection(1, 4);
            simulateKeyDown('Delete');
          });

          it('removes the selected characters', function() {
            expect(getInputValue().substring(1, 4)).to.equal('3/4');
          });

          it("doesn't move the cursor", function() {
            cursorPosShouldEql(1);
          });

          it('correctly shifts the mask characters', function() {
            expect(getInputValue()).to.equal('13/4_/____');
          });
        });
      });

      describe('pasting', function() {
        context('when the pasted content contains only valid characters', function() {
          before(function() {
            handleChange = sinon.spy();
            handleComplete = sinon.spy();
          });

          after(function() {
            handleChange = null;
            handleComplete = null;
          });

          beforeEach(function() {
            handleChange.reset();
            simulatePaste('12345');
          });

          afterEach(function() {
            handleChange.reset();
            handleComplete.reset();
          });

          it('adds the content to the value', function() {
            expect(getInputValue()).to.equal('12/34/5___');
          });

          it('moves the cursor to the correct position', function() {
            cursorPosShouldEql(7);
          });

          it('calls the onChange callback', function() {
            expect(handleChange).to.have.been.calledOnce;
            expect(handleChange).to.have.been.calledWithExactly({
              target: {
                value: '12/34/5___'
              }
            });
          });

          it("doesn't call the onComplete callback", function() {
            expect(handleComplete).to.have.not.been.called;
          });

          context('when the entire mask is filled', function() {
            beforeEach(function() {
              simulatePaste('678');
            });

            it('calls the onComplete callback', function() {
              expect(handleComplete).to.have.been.calledOnce;
              expect(handleComplete).to.have.been.calledWithExactly('12/34/5678');
            });
          });

          context('when input text is selected', function() {
            beforeEach(function() {
              getInput()._setSelection(1, 5);
              simulatePaste('67');
            });

            it('replaces the selected characters', function() {
              expect(getInputValue().substring(1, 5)).to.equal('6/75');
            });

            // TODO: Is this the right behavior?
            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(4);
            });

            it('correctly shifts the mask characters', function() {
              expect(getInputValue()).to.equal('16/75/____');
            });

          });
        });

        context('when the pasted content contains invalid characters', function() {
          beforeEach(function() {
            simulateKeyPress('1');
            simulatePaste('2a3b4c5');
          });

          it('adds the valid content to the value', function() {
            expect(getInputValue()).to.equal('12/34/5___');
          });

          it('moves the cursor to the correct position', function() {
            cursorPosShouldEql(7);
          });

          context('when input text is selected', function() {
            beforeEach(function() {
              getInput()._setSelection(1, 5);
              simulatePaste('6a7b');
            });

            it('replaces the selected characters', function() {
              expect(getInputValue().substring(1, 5)).to.equal('6/75');
            });

            it('moves the cursor to the correct position', function() {
              cursorPosShouldEql(4);
            });

            it('correctly shifts the mask characters', function() {
              expect(getInputValue()).to.equal('16/75/____');
            });
          });
        });
      });
    });

    context("when the mask is 'a-99'", function() {
      before(function() {
        mask = 'a-99';
      });

      describe('pressing the backspace key', function() {
        beforeEach(function() {
          simulateTyping('a12');
          getInput()._setSelection(1);
          simulateKeyDown('Backspace');
        });

        it('removes the preceding character', function() {
          expect(getInputValue()[0]).to.equal('_');
        });

        it('moves the cursor to the correct position', function() {
          cursorPosShouldEql(0);
        });

        it('correctly shifts the mask characters', function() {
          expect(getInputValue()).to.equal('_-12');
        });
      });
    });

    context("when the mask is 'aaaaaaaa'", function() {
      before(function() {
        mask = 'aaaaaaaa';
      });

      it('sets the placeholder correctly', function() {
        expect(getInputValue()).to.equal('________');
      });

      describe('pressing the enter key', function() {
        before(function() {
          handleKeyPress = sinon.spy();
        });

        after(function() {
          handleKeyPress = null;
        });

        beforeEach(function() {
          simulateKeyPress('Enter');
        });

        afterEach(function() {
          handleKeyPress.reset();
        });

        it("doesn't change the value", function() {
          expect(getInputValue()).to.equal('________');
        });

        it('calls the onKeyPress callback', function() {
          expect(handleKeyPress).to.have.been.calledOnce;
        });
      });
    });

    context("when the mask is '21-99999999'", function() {
      before(function() {
        mask = '21-99999999';
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
            expect(getInputValue()).to.equal('21-12345678');
          });
        });
      });

      describe('pressing the backspace key', function() {
        context('when the entire mask is selected', function() {
          beforeEach(function() {
            getInput()._setSelection(0, 11);
            simulateKeyDown('Backspace');
          });

          it('moves the cursor to the first non-mask position', function() {
            cursorPosShouldEql(3);
          });
        });
      });
    });

    context('when there is no mask', function() {
      before(function() {
        mask = null;
      });

      describe('setting an initial value', function() {
        before(function() {
          initialVal = '123abc';
        });

        after(function() {
          initialVal = null;
        });

        it('contains the initial value', function() {
          expect(getInputValue()).to.equal('123abc');
        });
      });

      describe('typing keys', function() {
        beforeEach(function() {
          var value;
          value = '1a2b3c';
          getInput().getDOMNode().value = '1a2b3c';
          getInput()._setSelection(value.length);
          TestUtils.Simulate.change(domNode);
        });

        it('adds the characters to the value', function() {
          expect(getInputValue()).to.equal('1a2b3c');
        });

        it('moves the cursor to the correct position', function() {
          cursorPosShouldEql(6);
        });
      });
    });

    context('when there is a pattern provided', function() {
      before(function() {
        mask = 'FFF';
        translations = {
          'F': /[F]/
        };
      });

      describe('typing a key', function() {
        context('when the character matches the mask', function() {
          beforeEach(function() {
            simulateKeyPress('F');
          });

          it('adds the character to the value', function() {
            expect(getInputValue()[0]).to.equal('F');
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
            expect(getInputValue()).to.equal('___');
          });

          it("doesn't change the cursor position", function() {
            cursorPosShouldEql(0);
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
      initialVal = null;
      getInput = () => component;
    });

    beforeEach(function(done) {
      var props;
      var props = {mask};
      if (format != null) {
        props.format = format;
      }
      if (initialVal != null) {
        props.value = initialVal;
      }
      if (translations != null) {
        props.translations = translations;
      }
      if (handleChange != null) {
        props.onChange = handleChange;
      }
      if (handleKeyDown != null) {
        props.onKeyDown = handleKeyDown;
      }
      if (handleKeyPress != null) {
        props.onKeyPress = handleKeyPress;
      }
      if (handleComplete != null) {
        props.onComplete = handleComplete;
      }
      if ((initialVal != null) && (handleChange == null)) {
        props.readOnly = true;
      }
      component = React.render(<MaskedInput {...props} />, container);
      domNode = component.getDOMNode();

      simulateFocus(done);
    });

    setupTests(function() {
      describe('the placeholder', function() {
        context('when a format is given', function() {
          before(function() {
            format = 'mm/dd/yyyy';
          });

          after(function() {
            format = null;
          });

          it('fills in the placeholder with the format characters', function() {
            expect(getInputValue()).to.equal('mm/dd/yyyy');
          });
        });

        context('when no format is given', function() {
          it('fills in the placeholder with the default character', function() {
            expect(getInputValue()).to.equal('__/__/____');
          });
        });
      });
    });
  });

  context('when the component is controlled', function() {
    var ControlledWrapper = React.createClass({
      getInitialState: function() {
        return {
          value: this.props.initialVal
        };
      },
      handleChange: function(e) {
        if (this.props.onChange) {
          this.props.onChange({target: {value: e.target.value}});
        }
        this.setState({value: e.target.value});
      },
      render: function() {
        return (
          <MaskedInput
            {...this.props}
            value={this.state.value}
            onChange={this.handleChange}
            ref="input"
          />
        );
      }
    });

    before(function() {
      initialVal = '';
      getInput = () => component.refs.input;
    });

    beforeEach(function(done) {
      // TODO: Can we combine this with the above be?
      var props = {mask, initialVal};
      if (format != null) {
        props.format = format;
      }
      if (translations != null) {
        props.translations = translations;
      }
      if (handleChange != null) {
        props.onChange = handleChange;
      }
      if (handleKeyDown != null) {
        props.onKeyDown = handleKeyDown;
      }
      if (handleKeyPress != null) {
        props.onKeyPress = handleKeyPress;
      }
      if (handleComplete != null) {
        props.onComplete = handleComplete;
      }
      component = React.render(<ControlledWrapper {...props} />, container);
      domNode = component.getDOMNode();

      simulateFocus(done);
    });

    setupTests(function() {
      describe('initial render', function() {
        before(function() {
          handleChange = sinon.spy();
        });

        after(function() {
          handleChange = null;
        });

        afterEach(function() {
          handleChange.reset();
        });

        context('when the initial value is blank', function() {
          it('calls the onChange callback', function() {
            expect(handleChange).to.have.been.calledOnce;
            expect(handleChange).to.have.been.calledWithExactly({
              target: {
                value: '__/__/____'
              }
            });
          });
        });

        context('when the initial value matches the placeholder', function() {
          before(function() {
            initialVal = '__/__/____';
          });

          after(function() {
            initialVal = '';
          });

          it('does not call the onChange callback', function() {
            expect(handleChange).to.have.not.been.called;
          });
        });

        context("when the initial doesn't change when masked", function() {
          before(function() {
            initialVal = '1_/__/____';
          });

          after(function() {
            initialVal = '';
          });

          it('does not call the onChange callback', function() {
            expect(handleChange).to.have.not.been.called;
          });
        });
      });

      describe('setting an initial value', function() {
        before(function() {
          initialVal = '123456';
        });

        after(function() {
          initialVal = '';
        });

        context('when a format is given', function() {
          before(function() {
            format = 'mm/dd/yyyy';
          });

          after(function() {
            format = null;
          });

          it('fills in the missing characters with the format characters', function() {
            expect(getInputValue()).to.equal('12/34/56yy');
          });
        });

        context('when no format is given', function() {
          it('fills in the missing characters with the default character', function() {
            expect(getInputValue()).to.equal('12/34/56__');
          });
        });
      });
    });

    context('when the component uses ReactLink', function() {
      var LinkWrapper = React.createClass({
        mixins: [LinkedStateMixin],
        getInitialState: function() {
          return {value: this.props.initialVal};
        },
        render: function() {
          return <MaskedInput {...this.props} valueLink={this.linkState('value')} ref="input" />;
        }
      });

      before(function() {
        initialVal = '';
        getInput = () => component.refs.input;
      });

      beforeEach(function(done) {
        component = React.render(
          <LinkWrapper mask="99/99/9999" initialVal={initialVal} />,
          container
        );
        domNode = component.getDOMNode();

        simulateFocus(done);
      });

      describe('setting an initial value', function() {
        before(function() {
          initialVal = '12345';
        });

        after(function() {
          initialVal = '';
        });

        it('sets the input value', function() {
          expect(getInputValue()).to.equal('12/34/5___');
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
});
