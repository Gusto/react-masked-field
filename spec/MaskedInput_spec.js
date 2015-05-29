
'use strict';

var LinkedStateMixin, MaskedInput, React, TestUtils, chai, expect, sinon;

React = require('react');

TestUtils = require('react/lib/ReactTestUtils');

LinkedStateMixin = require('react/lib/LinkedStateMixin');

MaskedInput = require('../src/MaskedInput');

chai = require('chai');

expect = chai.expect;

sinon = require('sinon');

chai.use(require('sinon-chai'));

describe('MaskedInput', function() {
  var component, container, cursorPosShouldEql, domNode, format, getInput, getInputValue, handleChange, handleComplete, handleKeyDown, handleKeyPress, initialVal, mask, setupTests, simulateFocus, simulateKeyDown, simulateKeyPress, simulatePaste, translations;
  container = null;
  mask = null;
  component = null;
  domNode = null;
  initialVal = null;
  getInput = null;
  format = null;
  translations = null;
  handleChange = null;
  handleKeyDown = null;
  handleKeyPress = null;
  handleComplete = null;
  getInputValue = function() {
    return TestUtils.findRenderedDOMComponentWithTag(getInput(), 'input').getDOMNode().value;
  };
  cursorPosShouldEql = function(pos) {
    return expect(getInput()._getSelection()).to.eql({
      start: pos,
      end: pos
    });
  };
  simulateFocus = function(cb) {
    TestUtils.Simulate.focus(domNode);
    return setTimeout(function() {
      return cb();
    }, 0);
  };
  simulateKeyPress = function(key) {
    var cursorPos, defaultPrevented, newVal, prevVal, selection;
    selection = getInput()._getSelection();
    cursorPos = getInput()._getSelection().start;
    defaultPrevented = false;
    TestUtils.Simulate.keyPress(domNode, {
      key: key,
      preventDefault: function() {
        return defaultPrevented = true;
      }
    });
    if (!(defaultPrevented || key.length > 1)) {
      prevVal = getInputValue();
      newVal = prevVal.substring(0, selection.start) + key + prevVal.substr(selection.end);
      getInput()._setSelection(cursorPos + 1);
      return TestUtils.Simulate.change(domNode, {
        target: {
          value: newVal
        }
      });
    }
  };
  simulateKeyDown = function(key) {
    var defaultPrevented, end, newVal, prevVal, ref, start;
    defaultPrevented = false;
    TestUtils.Simulate.keyDown(domNode, {
      key: key,
      preventDefault: function() {
        return defaultPrevented = true;
      }
    });
    if (!defaultPrevented) {
      ref = getInput()._getSelection(), start = ref.start, end = ref.end;
      prevVal = getInputValue();
      if (start === end) {
        if (key === 'Backspace') {
          newVal = prevVal.substring(0, start - 1) + prevVal.substr(end);
        } else if (key === 'Delete') {
          newVal = prevVal.substring(0, start) + prevVal.substr(end + 1);
        }
      } else {
        newVal = prevVal.substring(0, start) + prevVal.substr(end);
      }
      return TestUtils.Simulate.change(domNode, {
        target: {
          value: newVal
        }
      });
    }
  };
  simulatePaste = function(content) {
    var cursorPos, newVal, prevVal;
    cursorPos = getInput()._getSelection();
    getInput()._setSelection(cursorPos.start + content.length);
    prevVal = getInputValue();
    newVal = prevVal.substring(0, cursorPos.start) + content + prevVal.substr(cursorPos.end);
    return TestUtils.Simulate.change(domNode, {
      target: {
        value: newVal
      }
    });
  };
  setupTests = function(additionalTests) {
    context("when the mask is '99/99/9999'", function() {
      before(function() {
        return mask = '99/99/9999';
      });
      additionalTests();
      describe('typing a key', function() {
        before(function() {
          handleChange = sinon.spy();
          return handleComplete = sinon.spy();
        });
        after(function() {
          handleChange = null;
          return handleComplete = null;
        });
        beforeEach(function() {
          return handleChange.reset();
        });
        afterEach(function() {
          handleChange.reset();
          return handleComplete.reset();
        });
        context('when the character matches the mask', function() {
          beforeEach(function() {
            return simulateKeyPress('2');
          });
          it('adds the character to the value', function() {
            return expect(getInputValue()[0]).to.equal('2');
          });
          it('moves the cursor to the correct position', function() {
            return cursorPosShouldEql(1);
          });
          it('correctly shifts the mask characters', function() {
            return expect(getInputValue()).to.equal('2_/__/____');
          });
          it('calls the onChange callback', function() {
            expect(handleChange).to.have.been.calledOnce;
            return expect(handleChange).to.have.been.calledWithExactly({
              target: {
                value: '2_/__/____'
              }
            });
          });
          it("doesn't call the onComplete callback", function() {
            return expect(handleComplete).to.have.not.been.called;
          });
          context('when the next character is a mask character', function() {
            return it('moves the cursor past the mask character', function() {
              simulateKeyPress('3');
              expect(getInputValue()).to.equal('23/__/____');
              return cursorPosShouldEql(3);
            });
          });
          context('when the cursor is in the middle of the value', function() {
            beforeEach(function() {
              var i, key, len, ref;
              ref = '34'.split('');
              for (i = 0, len = ref.length; i < len; i++) {
                key = ref[i];
                simulateKeyPress(key);
              }
              getInput()._setSelection(1);
              return simulateKeyPress('5');
            });
            it('adds the character to the value', function() {
              return expect(getInputValue()[1]).to.equal('5');
            });
            return it('moves the cursor to the correct position', function() {
              return cursorPosShouldEql(3);
            });
          });
          context('when input text is selected', function() {
            beforeEach(function() {
              var i, key, len, ref;
              ref = '345'.split('');
              for (i = 0, len = ref.length; i < len; i++) {
                key = ref[i];
                simulateKeyPress(key);
              }
              getInput()._setSelection(1, 5);
              return simulateKeyPress('6');
            });
            it('replaces the selected characters', function() {
              return expect(getInputValue().substring(1, 5)).to.equal('6/__');
            });
            it('moves the cursor to the correct position', function() {
              return cursorPosShouldEql(3);
            });
            it('correctly shifts the mask characters', function() {
              return expect(getInputValue()).to.equal('26/__/____');
            });
            return it('calls the onChange callback', function() {
              return expect(handleChange.callCount).to.equal(5);
            });
          });
          return context('when the entire mask is filled', function() {
            beforeEach(function() {
              var i, key, len, ref, results;
              ref = '2345678'.split('');
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                key = ref[i];
                results.push(simulateKeyPress(key));
              }
              return results;
            });
            return it('calls the onComplete callback', function() {
              expect(handleComplete).to.have.been.calledOnce;
              return expect(handleComplete).to.have.been.calledWithExactly('22/34/5678');
            });
          });
        });
        return context("when the character doesn't match the mask", function() {
          beforeEach(function() {
            return simulateKeyPress('A');
          });
          it("doesn't change the value", function() {
            return expect(getInputValue()).to.equal('__/__/____');
          });
          it("doesn't change the cursor position", function() {
            return cursorPosShouldEql(0);
          });
          it("doesn't call the onChange callback", function() {
            return expect(handleChange).to.have.not.been.called;
          });
          context('when the cursor is in the middle of the value', function() {
            beforeEach(function() {
              var i, key, len, ref;
              ref = '123'.split('');
              for (i = 0, len = ref.length; i < len; i++) {
                key = ref[i];
                simulateKeyPress(key);
              }
              getInput()._setSelection(1);
              return simulateKeyPress('A');
            });
            it("doesn't change the value", function() {
              return expect(getInputValue()).to.equal('12/3_/____');
            });
            return it("doesn't change the cursor position", function() {
              return cursorPosShouldEql(1);
            });
          });
          return context('when input text is selected', function() {
            beforeEach(function() {
              var i, key, len, ref;
              ref = '12345'.split('');
              for (i = 0, len = ref.length; i < len; i++) {
                key = ref[i];
                simulateKeyPress(key);
              }
              getInput()._setSelection(1, 5);
              return simulateKeyPress('A');
            });
            it('removes the selected characters', function() {
              return expect(getInputValue().substring(1, 5)).to.equal('5/__');
            });
            it('moves the cursor to the correct position', function() {
              return cursorPosShouldEql(1);
            });
            return it('correctly shifts the mask characters', function() {
              return expect(getInputValue()).to.equal('15/__/____');
            });
          });
        });
      });
      describe('pressing the backspace key', function() {
        beforeEach(function() {
          var i, key, len, ref;
          ref = '123'.split('');
          for (i = 0, len = ref.length; i < len; i++) {
            key = ref[i];
            simulateKeyPress(key);
          }
          return simulateKeyDown('Backspace');
        });
        it('removes the preceding character', function() {
          return expect(getInputValue()[3]).to.equal('_');
        });
        it('moves the cursor to the correct position', function() {
          return cursorPosShouldEql(3);
        });
        it('correctly shifts the mask characters', function() {
          return expect(getInputValue()).to.equal('12/__/____');
        });
        context('when the previous character is a mask character', function() {
          beforeEach(function() {
            return simulateKeyDown('Backspace');
          });
          it('removes the preceding non-mask character', function() {
            return expect(getInputValue()[1]).to.equal('_');
          });
          it('moves the cursor to the correct position', function() {
            return cursorPosShouldEql(1);
          });
          it('correctly shifts the mask characters', function() {
            return expect(getInputValue()).to.equal('1_/__/____');
          });
          return describe('typing another character', function() {
            beforeEach(function() {
              return simulateKeyPress('1');
            });
            return it('moves the cursor to the correct position', function() {
              return cursorPosShouldEql(3);
            });
          });
        });
        context('when the next character is a mask character', function() {
          beforeEach(function() {
            simulateKeyPress('3');
            getInput()._setSelection(2);
            return simulateKeyDown('Backspace');
          });
          return it('correctly shifts the non-mask characters', function() {
            return expect(getInputValue()).to.equal('13/__/____');
          });
        });
        context('when the cursor is at the beginning', function() {
          beforeEach(function() {
            getInput()._setSelection(0);
            return simulateKeyDown('Backspace');
          });
          return it("doesn't change the value", function() {
            return expect(getInputValue()).to.equal('12/__/____');
          });
        });
        return context('when input text is selected', function() {
          beforeEach(function() {
            var i, key, len, ref;
            ref = '345'.split('');
            for (i = 0, len = ref.length; i < len; i++) {
              key = ref[i];
              simulateKeyPress(key);
            }
            getInput()._setSelection(1, 4);
            return simulateKeyDown('Backspace');
          });
          it('removes the selected characters', function() {
            return expect(getInputValue().substring(1, 4)).to.equal('4/5');
          });
          it('moves the cursor to the correct position', function() {
            return cursorPosShouldEql(1);
          });
          return it('correctly shifts the mask characters', function() {
            return expect(getInputValue()).to.equal('14/5_/____');
          });
        });
      });
      describe('pressing the delete key', function() {
        before(function() {
          return handleKeyDown = sinon.spy();
        });
        after(function() {
          return handleKeyDown = null;
        });
        afterEach(function() {
          return handleKeyDown.reset();
        });
        beforeEach(function() {
          var i, key, len, ref;
          ref = '1234'.split('');
          for (i = 0, len = ref.length; i < len; i++) {
            key = ref[i];
            simulateKeyPress(key);
          }
          getInput()._setSelection(1);
          return simulateKeyDown('Delete');
        });
        it('removes the following non-mask character', function() {
          return expect(getInputValue()[3]).to.equal('4');
        });
        it("doesn't move the cursor", function() {
          return cursorPosShouldEql(1);
        });
        it('correctly shifts the mask characters', function() {
          return expect(getInputValue()).to.equal('13/4_/____');
        });
        it('calls the onKeyDown callback', function() {
          return expect(handleKeyDown).to.have.been.calledOnce;
        });
        context('when the following character is a mask character', function() {
          beforeEach(function() {
            getInput()._setSelection(2);
            return simulateKeyDown('Delete');
          });
          it('removes the following non-mask character', function() {
            return expect(getInputValue()[3]).to.equal('_');
          });
          it('moves the cursor to the correct position', function() {
            return cursorPosShouldEql(3);
          });
          return it('correctly shifts the mask characters', function() {
            return expect(getInputValue()).to.equal('13/__/____');
          });
        });
        return context('when input text is selected', function() {
          beforeEach(function() {
            var i, key, len, ref;
            ref = '25'.split('');
            for (i = 0, len = ref.length; i < len; i++) {
              key = ref[i];
              simulateKeyPress(key);
            }
            getInput()._setSelection(1, 4);
            return simulateKeyDown('Delete');
          });
          it('removes the selected characters', function() {
            return expect(getInputValue().substring(1, 4)).to.equal('3/4');
          });
          it("doesn't move the cursor", function() {
            return cursorPosShouldEql(1);
          });
          return it('correctly shifts the mask characters', function() {
            return expect(getInputValue()).to.equal('13/4_/____');
          });
        });
      });
      return describe('pasting', function() {
        context('when the pasted content contains only valid characters', function() {
          before(function() {
            handleChange = sinon.spy();
            return handleComplete = sinon.spy();
          });
          after(function() {
            handleChange = null;
            return handleComplete = null;
          });
          beforeEach(function() {
            handleChange.reset();
            return simulatePaste('12345');
          });
          afterEach(function() {
            handleChange.reset();
            return handleComplete.reset();
          });
          it('adds the content to the value', function() {
            return expect(getInputValue()).to.equal('12/34/5___');
          });
          it('moves the cursor to the correct position', function() {
            return cursorPosShouldEql(7);
          });
          it('calls the onChange callback', function() {
            expect(handleChange).to.have.been.calledOnce;
            return expect(handleChange).to.have.been.calledWithExactly({
              target: {
                value: '12/34/5___'
              }
            });
          });
          it("doesn't call the onComplete callback", function() {
            return expect(handleComplete).to.have.not.been.called;
          });
          context('when the entire mask is filled', function() {
            beforeEach(function() {
              return simulatePaste('678');
            });
            return it('calls the onComplete callback', function() {
              expect(handleComplete).to.have.been.calledOnce;
              return expect(handleComplete).to.have.been.calledWithExactly('12/34/5678');
            });
          });
          return context('when input text is selected', function() {
            beforeEach(function() {
              getInput()._setSelection(1, 5);
              return simulatePaste('67');
            });
            it('replaces the selected characters', function() {
              return expect(getInputValue().substring(1, 5)).to.equal('6/75');
            });
            it('moves the cursor to the correct position', function() {
              return cursorPosShouldEql(4);
            });
            return it('correctly shifts the mask characters', function() {
              return expect(getInputValue()).to.equal('16/75/____');
            });
          });
        });
        return context('when the pasted content contains invalid characters', function() {
          beforeEach(function() {
            simulateKeyPress('1');
            return simulatePaste('2a3b4c5');
          });
          it('adds the valid content to the value', function() {
            return expect(getInputValue()).to.equal('12/34/5___');
          });
          it('moves the cursor to the correct position', function() {
            return cursorPosShouldEql(7);
          });
          return context('when input text is selected', function() {
            beforeEach(function() {
              getInput()._setSelection(1, 5);
              return simulatePaste('6a7b');
            });
            it('replaces the selected characters', function() {
              return expect(getInputValue().substring(1, 5)).to.equal('6/75');
            });
            it('moves the cursor to the correct position', function() {
              return cursorPosShouldEql(4);
            });
            return it('correctly shifts the mask characters', function() {
              return expect(getInputValue()).to.equal('16/75/____');
            });
          });
        });
      });
    });
    context("when the mask is 'a-99'", function() {
      before(function() {
        return mask = 'a-99';
      });
      return describe('pressing the backspace key', function() {
        beforeEach(function() {
          var i, key, len, ref;
          ref = 'a12'.split('');
          for (i = 0, len = ref.length; i < len; i++) {
            key = ref[i];
            simulateKeyPress(key);
          }
          getInput()._setSelection(1);
          return simulateKeyDown('Backspace');
        });
        it('removes the preceding character', function() {
          return expect(getInputValue()[0]).to.equal('_');
        });
        it('moves the cursor to the correct position', function() {
          return cursorPosShouldEql(0);
        });
        return it('correctly shifts the mask characters', function() {
          return expect(getInputValue()).to.equal('_-12');
        });
      });
    });
    context("when the mask is 'aaaaaaaa'", function() {
      before(function() {
        return mask = 'aaaaaaaa';
      });
      it('sets the placeholder correctly', function() {
        return expect(getInputValue()).to.equal('________');
      });
      return describe('pressing the enter key', function() {
        before(function() {
          return handleKeyPress = sinon.spy();
        });
        after(function() {
          return handleKeyPress = null;
        });
        beforeEach(function() {
          return simulateKeyPress('Enter');
        });
        afterEach(function() {
          return handleKeyPress.reset();
        });
        it("doesn't change the value", function() {
          return expect(getInputValue()).to.equal('________');
        });
        return it('calls the onKeyPress callback', function() {
          return expect(handleKeyPress).to.have.been.calledOnce;
        });
      });
    });
    context("when the mask is '21-99999999'", function() {
      before(function() {
        return mask = '21-99999999';
      });
      describe('initial state', function() {
        return it('sets the cursor to the first non-mask character', function() {
          return cursorPosShouldEql(3);
        });
      });
      describe('pasting', function() {
        return context('when the cursor is at the beginning', function() {
          beforeEach(function() {
            return simulatePaste('12345678');
          });
          return it('adds the content to the value', function() {
            return expect(getInputValue()).to.equal('21-12345678');
          });
        });
      });
      return describe('pressing the backspace key', function() {
        return context('when the entire mask is selected', function() {
          beforeEach(function() {
            getInput()._setSelection(0, 11);
            return simulateKeyDown('Backspace');
          });
          return it('moves the cursor to the first non-mask position', function() {
            return cursorPosShouldEql(3);
          });
        });
      });
    });
    context('when there is no mask', function() {
      before(function() {
        return mask = null;
      });
      describe('setting an initial value', function() {
        before(function() {
          return initialVal = '123abc';
        });
        after(function() {
          return initialVal = null;
        });
        return it('contains the initial value', function() {
          return expect(getInputValue()).to.equal('123abc');
        });
      });
      return describe('typing keys', function() {
        beforeEach(function() {
          var value;
          value = '1a2b3c';
          getInput().getDOMNode().value = '1a2b3c';
          getInput()._setSelection(value.length);
          return TestUtils.Simulate.change(domNode);
        });
        it('adds the characters to the value', function() {
          return expect(getInputValue()).to.equal('1a2b3c');
        });
        return it('moves the cursor to the correct position', function() {
          return cursorPosShouldEql(6);
        });
      });
    });
    return context('when there is a pattern provided', function() {
      before(function() {
        mask = 'FFF';
        return translations = {
          'F': /[F]/
        };
      });
      return describe('typing a key', function() {
        context('when the character matches the mask', function() {
          beforeEach(function() {
            return simulateKeyPress('F');
          });
          it('adds the character to the value', function() {
            return expect(getInputValue()[0]).to.equal('F');
          });
          return it('moves the cursor to the correct position', function() {
            return cursorPosShouldEql(1);
          });
        });
        return context("when the character doesn't match the mask", function() {
          beforeEach(function() {
            return simulateKeyPress('A');
          });
          it("doesn't change the value", function() {
            return expect(getInputValue()).to.equal('___');
          });
          return it("doesn't change the cursor position", function() {
            return cursorPosShouldEql(0);
          });
        });
      });
    });
  };
  beforeEach(function() {
    if (container != null) {
      document.body.removeChild(container);
    }
    container = document.createElement('div');
    return document.body.appendChild(container);
  });
  context("when the component isn't controlled", function() {
    before(function() {
      initialVal = null;
      return getInput = function() {
        return component;
      };
    });
    beforeEach(function(done) {
      var props;
      props = {
        mask: mask
      };
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
      component = React.render(React.createElement(MaskedInput, React.__spread({}, props)), container);
      domNode = component.getDOMNode();
      return simulateFocus(function() {
        return done();
      });
    });
    return setupTests(function() {
      return describe('the placeholder', function() {
        context('when a format is given', function() {
          before(function() {
            return format = 'mm/dd/yyyy';
          });
          after(function() {
            return format = null;
          });
          return it('fills in the placeholder with the format characters', function() {
            return expect(getInputValue()).to.equal('mm/dd/yyyy');
          });
        });
        return context('when no format is given', function() {
          return it('fills in the placeholder with the default character', function() {
            return expect(getInputValue()).to.equal('__/__/____');
          });
        });
      });
    });
  });
  return context('when the component is controlled', function() {
    var ControlledWrapper;
    ControlledWrapper = React.createClass({
      getInitialState: function() {
        return {
          value: this.props.initialVal
        };
      },
      handleChange: function(e) {
        var base;
        if (typeof (base = this.props).onChange === "function") {
          base.onChange({
            target: {
              value: e.target.value
            }
          });
        }
        return this.setState({
          value: e.target.value
        });
      },
      render: function() {
        return React.createElement(MaskedInput, React.__spread({}, this.props, {
          "value": this.state.value,
          "onChange": this.handleChange,
          "ref": 'input'
        }));
      }
    });
    before(function() {
      initialVal = '';
      return getInput = function() {
        return component.refs.input;
      };
    });
    beforeEach(function(done) {
      var props;
      props = {
        mask: mask,
        initialVal: initialVal
      };
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
      component = React.render(React.createElement(ControlledWrapper, React.__spread({}, props)), container);
      domNode = component.getDOMNode();
      return simulateFocus(function() {
        return done();
      });
    });
    setupTests(function() {
      describe('initial render', function() {
        before(function() {
          return handleChange = sinon.spy();
        });
        after(function() {
          return handleChange = null;
        });
        afterEach(function() {
          return handleChange.reset();
        });
        context('when the initial value is blank', function() {
          return it('calls the onChange callback', function() {
            expect(handleChange).to.have.been.calledOnce;
            return expect(handleChange).to.have.been.calledWithExactly({
              target: {
                value: '__/__/____'
              }
            });
          });
        });
        context('when the initial value matches the placeholder', function() {
          before(function() {
            return initialVal = '__/__/____';
          });
          after(function() {
            return initialVal = '';
          });
          return it('does not call the onChange callback', function() {
            return expect(handleChange).to.have.not.been.called;
          });
        });
        return context("when the initial doesn't change when masked", function() {
          before(function() {
            return initialVal = '1_/__/____';
          });
          after(function() {
            return initialVal = '';
          });
          return it('does not call the onChange callback', function() {
            return expect(handleChange).to.have.not.been.called;
          });
        });
      });
      return describe('setting an initial value', function() {
        before(function() {
          return initialVal = '123456';
        });
        after(function() {
          return initialVal = '';
        });
        context('when a format is given', function() {
          before(function() {
            return format = 'mm/dd/yyyy';
          });
          after(function() {
            return format = null;
          });
          return it('fills in the missing characters with the format characters', function() {
            return expect(getInputValue()).to.equal('12/34/56yy');
          });
        });
        return context('when no format is given', function() {
          return it('fills in the missing characters with the default character', function() {
            return expect(getInputValue()).to.equal('12/34/56__');
          });
        });
      });
    });
    return context('when the component uses ReactLink', function() {
      var LinkWrapper;
      LinkWrapper = React.createClass({
        mixins: [LinkedStateMixin],
        getInitialState: function() {
          return {
            value: this.props.initialVal
          };
        },
        render: function() {
          return React.createElement(MaskedInput, React.__spread({}, this.props, {
            "valueLink": this.linkState('value'),
            "ref": 'input'
          }));
        }
      });
      before(function() {
        initialVal = '';
        return getInput = function() {
          return component.refs.input;
        };
      });
      beforeEach(function(done) {
        var props;
        props = {
          mask: mask,
          initialVal: initialVal
        };
        component = React.render(React.createElement(LinkWrapper, {
          "mask": "99/99/9999",
          "initialVal": initialVal
        }), container);
        domNode = component.getDOMNode();
        return simulateFocus(function() {
          return done();
        });
      });
      describe('setting an initial value', function() {
        before(function() {
          return initialVal = '12345';
        });
        after(function() {
          return initialVal = '';
        });
        it('sets the input value', function() {
          return expect(getInputValue()).to.equal('12/34/5___');
        });
        return it('sets the state of the parent component', function() {
          return expect(component.state.value).to.equal('12/34/5___');
        });
      });
      describe('pasting', function() {
        beforeEach(function() {
          return simulatePaste('12345');
        });
        return it('updates the state of the parent component', function() {
          return expect(component.state.value).to.equal('12/34/5___');
        });
      });
      return describe('pressing the backspace key', function() {
        beforeEach(function() {
          var i, key, len, ref;
          ref = '12345'.split('');
          for (i = 0, len = ref.length; i < len; i++) {
            key = ref[i];
            simulateKeyPress(key);
          }
          return simulateKeyDown('Backspace');
        });
        return it('updates the state of the parent component', function() {
          return expect(component.state.value).to.equal('12/34/____');
        });
      });
    });
  });
});
