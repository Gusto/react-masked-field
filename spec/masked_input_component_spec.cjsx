React = require 'react'
TestUtils = require 'react/lib/ReactTestUtils'
LinkedStateMixin = require 'react/lib/LinkedStateMixin'
MaskedInput = require '../src/masked_input'
chai = require 'chai'
expect = chai.expect
sinon = require 'sinon'
chai.use(require 'sinon-chai')

describe 'MaskedInput', ->
  container = null
  mask = null
  component = null
  domNode = null
  initialVal = null
  getInput = null
  format = null
  translations = null

  handleChange = null
  handleKeyDown = null
  handleKeyPress = null
  handleComplete = null

  # FIXME:
  # - up/down arow behavior
  # - undo?

  # TODO:
  # - When to show the placeholder
  # - Should the cursor be set to the first non-mask char?

  getInputValue = ->
    TestUtils.findRenderedDOMComponentWithTag(getInput(), 'input').getDOMNode().value

  cursorPosShouldEql = (pos) ->
    expect(getInput()._getSelection()).to.eql start: pos, end: pos

  simulateFocus = (cb) ->
    TestUtils.Simulate.focus domNode
    setTimeout ->
      cb()
    , 0

  simulateKeyPress = (key) ->
    selection = getInput()._getSelection()
    cursorPos = getInput()._getSelection().start
    defaultPrevented = false
    TestUtils.Simulate.keyPress domNode,
      key: key
      preventDefault: -> defaultPrevented = true

    unless defaultPrevented || key.length > 1
      prevVal = getInputValue()
      newVal = prevVal.substring(0, selection.start) + key + prevVal.substr(selection.end)
      getInput()._setSelection(cursorPos + 1)
      TestUtils.Simulate.change domNode,
        target:
          value: newVal

  simulateKeyDown = (key) ->
    defaultPrevented = false
    TestUtils.Simulate.keyDown(domNode,
      key: key
      preventDefault: -> defaultPrevented = true
    )

    unless defaultPrevented
      {start, end} = getInput()._getSelection()
      prevVal = getInputValue()
      if start is end
        if key is 'Backspace'
          newVal = prevVal.substring(0, start-1) + prevVal.substr(end)
        else if key is 'Delete'
          newVal = prevVal.substring(0, start) + prevVal.substr(end+1)
      else
        newVal = prevVal.substring(0, start) + prevVal.substr(end)

      TestUtils.Simulate.change domNode,
        target:
          value: newVal

  simulatePaste = (content) ->
    cursorPos = getInput()._getSelection()
    getInput()._setSelection(cursorPos.start + content.length)
    prevVal = getInputValue()
    newVal = prevVal.substring(0, cursorPos.start) + content + prevVal.substr(cursorPos.end)
    TestUtils.Simulate.change domNode,
      target:
        value: newVal

  setupTests = (additionalTests) ->
    context "when the mask is '99/99/9999'", ->
      before ->
        mask = '99/99/9999'

      additionalTests()

      describe 'typing a key', ->
        before ->
          handleChange = sinon.spy()
          handleComplete = sinon.spy()

        after ->
          handleChange = null
          handleComplete = null

        beforeEach ->
          handleChange.reset()

        afterEach ->
          handleChange.reset()
          handleComplete.reset()

        context 'when the character matches the mask', ->
          beforeEach ->
            simulateKeyPress '2'

          it 'adds the character to the value', ->
            expect(getInputValue()[0]).to.equal '2'

          it 'moves the cursor to the correct position', ->
            cursorPosShouldEql 1

          it 'correctly shifts the mask characters', ->
            expect(getInputValue()).to.equal '2_/__/____'

          it 'calls the onChange callback', ->
            expect(handleChange).to.have.been.calledOnce
            expect(handleChange).to.have.been.calledWithExactly target: value: '2_/__/____'

          it "doesn't call the onComplete callback", ->
            expect(handleComplete).to.have.not.been.called

          context 'when the next character is a mask character', ->
            # TODO: be?
            it 'moves the cursor past the mask character', ->
              simulateKeyPress '3'
              expect(getInputValue()).to.equal '23/__/____'
              cursorPosShouldEql 3

          context 'when the cursor is in the middle of the value', ->
            beforeEach ->
              simulateKeyPress key for key in '34'.split('')
              getInput()._setSelection 1
              simulateKeyPress '5'

            it 'adds the character to the value', ->
              expect(getInputValue()[1]).to.equal '5'

            it 'moves the cursor to the correct position', ->
              cursorPosShouldEql 3

          context 'when input text is selected', ->
            beforeEach ->
              simulateKeyPress key for key in '345'.split('')
              getInput()._setSelection 1, 5
              simulateKeyPress '6'

            it 'replaces the selected characters', ->
              expect(getInputValue().substring 1, 5).to.equal '6/__'

            it 'moves the cursor to the correct position', ->
              cursorPosShouldEql 3

            it 'correctly shifts the mask characters', ->
              expect(getInputValue()).to.equal '26/__/____'

            it 'calls the onChange callback', ->
              expect(handleChange.callCount).to.equal 5

          context 'when the entire mask is filled', ->
            beforeEach ->
              simulateKeyPress key for key in '2345678'.split('')

            it 'calls the onComplete callback', ->
              expect(handleComplete).to.have.been.calledOnce
              expect(handleComplete).to.have.been.calledWithExactly '22/34/5678'

        context "when the character doesn't match the mask", ->
          beforeEach ->
            simulateKeyPress 'A'

          it "doesn't change the value", ->
            expect(getInputValue()).to.equal '__/__/____'

          it "doesn't change the cursor position", ->
            cursorPosShouldEql 0

          it "doesn't call the onChange callback", ->
            expect(handleChange).to.have.not.been.called

          context 'when the cursor is in the middle of the value', ->
            beforeEach ->
              simulateKeyPress key for key in '123'.split('')
              getInput()._setSelection 1
              simulateKeyPress 'A'

            it "doesn't change the value", ->
              expect(getInputValue()).to.equal '12/3_/____'

            it "doesn't change the cursor position", ->
              cursorPosShouldEql 1

          context 'when input text is selected', ->
            beforeEach ->
              simulateKeyPress key for key in '12345'.split('')
              getInput()._setSelection 1, 5
              simulateKeyPress 'A'

            it 'removes the selected characters', ->
              expect(getInputValue().substring 1, 5).to.equal '5/__'

            it 'moves the cursor to the correct position', ->
              cursorPosShouldEql 1

            it 'correctly shifts the mask characters', ->
              expect(getInputValue()).to.equal '15/__/____'

      describe 'pressing the backspace key', ->
        beforeEach ->
          simulateKeyPress key for key in '123'.split('')
          simulateKeyDown 'Backspace'

        it 'removes the preceding character', ->
          expect(getInputValue()[3]).to.equal '_'

        it 'moves the cursor to the correct position', ->
          cursorPosShouldEql 3

        it 'correctly shifts the mask characters', ->
          expect(getInputValue()).to.equal '12/__/____'

        context 'when the previous character is a mask character', ->
          beforeEach ->
            simulateKeyDown 'Backspace'

          it 'removes the preceding non-mask character', ->
            expect(getInputValue()[1]).to.equal '_'

          it 'moves the cursor to the correct position', ->
            cursorPosShouldEql 1

          it 'correctly shifts the mask characters', ->
            expect(getInputValue()).to.equal '1_/__/____'

          describe 'typing another character', ->
            beforeEach ->
              simulateKeyPress '1'

            it 'moves the cursor to the correct position', ->
              cursorPosShouldEql 3

        context 'when the next character is a mask character', ->
          beforeEach ->
            simulateKeyPress '3'
            getInput()._setSelection 2
            simulateKeyDown 'Backspace'

          it 'correctly shifts the non-mask characters', ->
            expect(getInputValue()).to.equal '13/__/____'

        context 'when the cursor is at the beginning', ->
          beforeEach ->
            getInput()._setSelection 0
            simulateKeyDown 'Backspace'

          it "doesn't change the value", ->
            expect(getInputValue()).to.equal '12/__/____'

        context 'when input text is selected', ->
          beforeEach ->
            simulateKeyPress key for key in '345'.split('')
            getInput()._setSelection 1, 4
            simulateKeyDown 'Backspace'

          it 'removes the selected characters', ->
            expect(getInputValue().substring 1, 4).to.equal '4/5'

          it 'moves the cursor to the correct position', ->
            cursorPosShouldEql 1

          it 'correctly shifts the mask characters', ->
            expect(getInputValue()).to.equal '14/5_/____'

      describe 'pressing the delete key', ->
        before ->
          handleKeyDown = sinon.spy()

        after ->
          handleKeyDown = null

        afterEach ->
          handleKeyDown.reset()

        beforeEach ->
          simulateKeyPress key for key in '1234'.split('')
          getInput()._setSelection 1
          simulateKeyDown 'Delete'

        it 'removes the following non-mask character', ->
          expect(getInputValue()[3]).to.equal '4'

        it "doesn't move the cursor", ->
          cursorPosShouldEql 1

        it 'correctly shifts the mask characters', ->
          expect(getInputValue()).to.equal '13/4_/____'

        it 'calls the onKeyDown callback', ->
          expect(handleKeyDown).to.have.been.calledOnce

        context 'when the following character is a mask character', ->
          beforeEach ->
            getInput()._setSelection 2
            simulateKeyDown 'Delete'

          it 'removes the following non-mask character', ->
            expect(getInputValue()[3]).to.equal '_'

          it 'moves the cursor to the correct position', ->
            cursorPosShouldEql 3

          it 'correctly shifts the mask characters', ->
            expect(getInputValue()).to.equal '13/__/____'

        context 'when input text is selected', ->
          beforeEach ->
            simulateKeyPress key for key in '25'.split('')
            getInput()._setSelection 1, 4
            simulateKeyDown 'Delete'

          it 'removes the selected characters', ->
            expect(getInputValue().substring 1, 4).to.equal '3/4'

          it "doesn't move the cursor", ->
            cursorPosShouldEql 1

          it 'correctly shifts the mask characters', ->
            expect(getInputValue()).to.equal '13/4_/____'

      describe 'pasting', ->
        context 'when the pasted content contains only valid characters', ->
          before ->
            handleChange = sinon.spy()
            handleComplete = sinon.spy()

          after ->
            handleChange = null
            handleComplete = null

          beforeEach ->
            handleChange.reset()
            simulatePaste '12345'

          afterEach ->
            handleChange.reset()
            handleComplete.reset()

          it 'adds the content to the value', ->
            expect(getInputValue()).to.equal '12/34/5___'

          it 'moves the cursor to the correct position', ->
            cursorPosShouldEql 7

          it 'calls the onChange callback', ->
            expect(handleChange).to.have.been.calledOnce
            expect(handleChange).to.have.been.calledWithExactly target: value: '12/34/5___'

          it "doesn't call the onComplete callback", ->
            expect(handleComplete).to.have.not.been.called

          context 'when the entire mask is filled', ->
            beforeEach ->
              simulatePaste '678'

            it 'calls the onComplete callback', ->
              expect(handleComplete).to.have.been.calledOnce
              expect(handleComplete).to.have.been.calledWithExactly '12/34/5678'

          context 'when input text is selected', ->
            beforeEach ->
              getInput()._setSelection 1, 5
              simulatePaste '67'

            it 'replaces the selected characters', ->
              expect(getInputValue().substring 1, 5).to.equal '6/75'

            # TODO: Is this the right behavior?
            it 'moves the cursor to the correct position', ->
              cursorPosShouldEql 4

            it 'correctly shifts the mask characters', ->
              expect(getInputValue()).to.equal '16/75/____'

        context 'when the pasted content contains invalid characters', ->
          beforeEach ->
            simulateKeyPress '1'
            simulatePaste '2a3b4c5'

          it 'adds the valid content to the value', ->
            expect(getInputValue()).to.equal '12/34/5___'

          it 'moves the cursor to the correct position', ->
            cursorPosShouldEql 7

          context 'when input text is selected', ->
            beforeEach ->
              getInput()._setSelection 1, 5
              simulatePaste '6a7b'

            it 'replaces the selected characters', ->
              expect(getInputValue().substring 1, 5).to.equal '6/75'

            it 'moves the cursor to the correct position', ->
              cursorPosShouldEql 4

            it 'correctly shifts the mask characters', ->
              expect(getInputValue()).to.equal '16/75/____'

    context "when the mask is 'a-99'", ->
      before ->
        mask = 'a-99'

      describe 'pressing the backspace key', ->
        beforeEach ->
          simulateKeyPress key for key in 'a12'.split('')
          getInput()._setSelection 1
          simulateKeyDown 'Backspace'

        it 'removes the preceding character', ->
          expect(getInputValue()[0]).to.equal '_'

        it 'moves the cursor to the correct position', ->
          cursorPosShouldEql 0

        it 'correctly shifts the mask characters', ->
          expect(getInputValue()).to.equal '_-12'

    context "when the mask is 'aaaaaaaa'", ->
      before ->
        mask = 'aaaaaaaa'

      it 'sets the placeholder correctly', ->
        expect(getInputValue()).to.equal '________'

      describe 'pressing the enter key', ->
        before ->
          handleKeyPress = sinon.spy()

        after ->
          handleKeyPress = null

        beforeEach ->
          simulateKeyPress 'Enter'

        afterEach ->
          handleKeyPress.reset()

        it "doesn't change the value", ->
          expect(getInputValue()).to.equal '________'

        it 'calls the onKeyPress callback', ->
          expect(handleKeyPress).to.have.been.calledOnce

    context "when the mask is '21-99999999'", ->
      before ->
        mask = '21-99999999'

      describe 'initial state', ->
        it 'sets the cursor to the first non-mask character', ->
          cursorPosShouldEql 3

      describe 'pasting', ->
        context 'when the cursor is at the beginning', ->
          beforeEach ->
            simulatePaste '12345678'

          it 'adds the content to the value', ->
            expect(getInputValue()).to.equal '21-12345678'

      describe 'pressing the backspace key', ->
        context 'when the entire mask is selected', ->
          beforeEach ->
            getInput()._setSelection 0, 11
            simulateKeyDown 'Backspace'

          it 'moves the cursor to the first non-mask position', ->
            cursorPosShouldEql 3

    context 'when there is no mask', ->
      before ->
        mask = null

      describe 'setting an initial value', ->
        before ->
          initialVal = '123abc'

        after ->
          initialVal = null

        it 'contains the initial value', ->
          expect(getInputValue()).to.equal '123abc'

      describe 'typing keys', ->
        beforeEach ->
          value = '1a2b3c'
          getInput().getDOMNode().value = '1a2b3c'
          getInput()._setSelection(value.length)
          TestUtils.Simulate.change domNode

        it 'adds the characters to the value', ->
          expect(getInputValue()).to.equal '1a2b3c'

        it 'moves the cursor to the correct position', ->
          cursorPosShouldEql 6

    context 'when there is a pattern provided', ->
      before ->
        mask = 'FFF'
        translations =
          'F': /[F]/

      describe 'typing a key', ->
        context 'when the character matches the mask', ->
          beforeEach ->
            simulateKeyPress 'F'

          it 'adds the character to the value', ->
            expect(getInputValue()[0]).to.equal 'F'

          it 'moves the cursor to the correct position', ->
            cursorPosShouldEql 1

        context "when the character doesn't match the mask", ->
          beforeEach ->
            simulateKeyPress 'A'

          it "doesn't change the value", ->
            expect(getInputValue()).to.equal '___'

          it "doesn't change the cursor position", ->
            cursorPosShouldEql 0

  beforeEach ->
    document.body.removeChild(container) if container?
    container = document.createElement('div')
    document.body.appendChild(container)

  context "when the component isn't controlled", ->
    before ->
      initialVal = null
      getInput = -> component

    beforeEach (done) ->
      props = {mask}
      props.format = format if format?
      props.value = initialVal if initialVal?
      props.translations = translations if translations?
      props.onChange = handleChange if handleChange?
      props.onKeyDown = handleKeyDown if handleKeyDown?
      props.onKeyPress = handleKeyPress if handleKeyPress?
      props.onComplete = handleComplete if handleComplete?
      props.readOnly = true if initialVal? && not handleChange?
      component = React.render(<MaskedInput {...props} />, container)
      domNode = component.getDOMNode()

      simulateFocus -> done()

    setupTests ->
      describe 'the placeholder', ->
        context 'when a format is given', ->
          before ->
            format = 'mm/dd/yyyy'

          after ->
            format = null

          it 'fills in the placeholder with the format characters', ->
            expect(getInputValue()).to.equal 'mm/dd/yyyy'

        context 'when no format is given', ->
          it 'fills in the placeholder with the default character', ->
            expect(getInputValue()).to.equal '__/__/____'

  context 'when the component is controlled', ->
    ControlledWrapper = React.createClass
      getInitialState: ->
        value: @props.initialVal

      handleChange: (e) ->
        @props.onChange?(target: value: e.target.value)
        @setState value: e.target.value

      render: ->
        <MaskedInput {...@props} value={@state.value} onChange={@handleChange} ref='input' />

    before ->
      initialVal = ''
      getInput = -> component.refs.input

    beforeEach (done) ->
      # TODO: Can we combine this with the above be?
      props = {mask, initialVal}
      props.format = format if format?
      props.translations = translations if translations?
      props.onChange = handleChange if handleChange?
      props.onKeyDown = handleKeyDown if handleKeyDown?
      props.onKeyPress = handleKeyPress if handleKeyPress?
      props.onComplete = handleComplete if handleComplete?
      component = React.render(<ControlledWrapper {...props} />, container)
      domNode = component.getDOMNode()

      simulateFocus -> done()

    setupTests ->
      describe 'initial render', ->
        before ->
          handleChange = sinon.spy()

        after ->
          handleChange = null

        afterEach ->
          handleChange.reset()

        context 'when the initial value is blank', ->
          it 'calls the onChange callback', ->
            expect(handleChange).to.have.been.calledOnce
            expect(handleChange).to.have.been.calledWithExactly target: value: '__/__/____'

        context 'when the initial value matches the placeholder', ->
          before ->
            initialVal = '__/__/____'

          after ->
            initialVal = ''

          it 'does not call the onChange callback', ->
            expect(handleChange).to.have.not.been.called

        context "when the initial doesn't change when masked", ->
          before ->
            initialVal = '1_/__/____'

          after ->
            initialVal = ''

          it 'does not call the onChange callback', ->
            expect(handleChange).to.have.not.been.called

      describe 'setting an initial value', ->
        before ->
          initialVal = '123456'

        after ->
          initialVal = ''

        context 'when a format is given', ->
          before ->
            format = 'mm/dd/yyyy'

          after ->
            format = null

          it 'fills in the missing characters with the format characters', ->
            expect(getInputValue()).to.equal '12/34/56yy'

        context 'when no format is given', ->
          it 'fills in the missing characters with the default character', ->
            expect(getInputValue()).to.equal '12/34/56__'

    context 'when the component uses ReactLink', ->
      LinkWrapper = React.createClass
        mixins: [LinkedStateMixin]

        getInitialState: ->
          value: @props.initialVal

        render: ->
          <MaskedInput {...@props} valueLink={@linkState('value')} ref='input' />

      before ->
        initialVal = ''
        getInput = -> component.refs.input

      beforeEach (done) ->
        props = {mask, initialVal}
        component = React.render(
          <LinkWrapper mask="99/99/9999" initialVal={initialVal} />,
          container
        )
        domNode = component.getDOMNode()

        simulateFocus -> done()

      describe 'setting an initial value', ->
        before ->
          initialVal = '12345'

        after ->
          initialVal = ''

        it 'sets the input value', ->
          expect(getInputValue()).to.equal '12/34/5___'

        it 'sets the state of the parent component', ->
          expect(component.state.value).to.equal '12/34/5___'

      describe 'pasting', ->
        beforeEach ->
          simulatePaste '12345'

        it 'updates the state of the parent component', ->
          expect(component.state.value).to.equal '12/34/5___'

      describe 'pressing the backspace key', ->
        beforeEach ->
          simulateKeyPress key for key in '12345'.split('')
          simulateKeyDown 'Backspace'

        it 'updates the state of the parent component', ->
          expect(component.state.value).to.equal '12/34/____'
