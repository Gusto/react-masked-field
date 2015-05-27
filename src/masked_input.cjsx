React = window?.React || require 'react'
jsdiff = require 'diff'

assert = require('chai').assert

DEFAULT_TRANSLATIONS =
  '9': /\d/
  'a': /[A-Za-z]/
  '*': /[A-Za-z0-9]/

MaskedInput = React.createClass
  displayName: 'MaskedInput'

  # TODO: format validation
  propTypes:
    mask: React.PropTypes.string
    format: React.PropTypes.string
    translations: React.PropTypes.object
    onChange: React.PropTypes.func
    onKeyDown: React.PropTypes.func
    onKeyPress: React.PropTypes.func
    onComplete: React.PropTypes.func

  getDefaultProps: ->
    format: '_'

  getInitialState: ->
    # TODO: should this reflect the @props.value ?
    return null unless @props.mask?

    @_buffer =
      for char, idx in @props.mask
        if @_getPattern(idx)
          @_firstNonMaskIdx ?= idx
          @_getFormatChar(idx)
        else
          char

    @_cursorPos = @_firstNonMaskIdx
    value: @_buffer.join('')

  componentDidUpdate: ->
    @_setSelection(@_cursorPos) if @_cursorPos?

  componentDidMount: ->
    # TODO: any other lifecycle functions we need to modify when there's no mask?
    return unless @props.mask?

    if @props.onChange? && @props.value?
      # TODO: should @state.value already be ready to use here?
      value = @_maskedValue(@props.value)
      @props.onChange(target: {value}) if value isnt @props.value

  render: ->
    props = {}
    if @props.mask?
      props.onChange = @_handleChange
      # props.onKeyPress = @_handleKeyPress
      props.onKeyDown = @_handleKeyDown
      props.onFocus = @_handleFocus
      props.value =
        if @props.value? && @props.value isnt @state.value
          @_maskedValue(@props.value)
        else
          @state.value

    <input {...@props} {...props} />

  _getSelection: ->
    return {begin: 0, end: 0} unless @isMounted()

    node = @getDOMNode()
    if node.setSelectionRange?
      begin = node.selectionStart
      end = node.selectionEnd
    else
      range = document.selection.createRange()
      begin = 0 - range.duplicate().moveStart 'character', -100000
      end = begin + range.text.length

    {begin, end}

  _setSelection: (begin, end=begin) ->
    node = @getDOMNode()
    if node.setSelectionRange?
      node.setSelectionRange(begin, end)
    else
      range = node.createTextRange()
      range.collapse true
      range.moveEnd 'character', begin
      range.moveStart 'character', end
      range.select()

  _getPattern: (idx) ->
    maskChar = @props.mask[idx]
    @props.translations?[maskChar] || DEFAULT_TRANSLATIONS[maskChar]

  _getFormatChar: (idx) ->
    idx = if idx < @props.format.length then idx else 0
    @props.format[idx]

  _resetBuffer: (start, end) ->
    @_buffer[i] = @_getFormatChar(i) for i in [start...end] when @_getPattern(i)?
    true

  _seekNext: (pos) ->
    true while ++pos < @props.mask.length && not @_getPattern(pos)?
    pos

  _seekPrev: (pos) ->
    # TODO: Not a big fan of this...
    true while --pos >= 0 && not @_getPattern(pos)?
    pos

  _shiftLeft: (begin, end) ->
    @_resetBuffer(begin, end)
    return if begin < 0

    next = @_seekNext(end - 1)
    for i in [begin...@props.mask.length]
      pattern = @_getPattern(i)
      if pattern?
        if next < @props.mask.length && pattern.test(@_buffer[next])
          @_buffer[i] = @_buffer[next]
          @_buffer[next] = @_getFormatChar(next)
        else
          break

        next = @_seekNext(next)

    @_cursorPos = Math.max(begin, @_firstNonMaskIdx)

  _shiftRight: (pos) ->
    c = @_getFormatChar(pos)
    for i in [pos...@props.mask.length]
      pattern = @_getPattern(i)
      if pattern?
        next = @_seekNext(i)
        t = @_buffer[i]
        @_buffer[i] = c
        if next < @props.mask.length && pattern.test(t)
          c = t
        else
          break
    true

  _callOnComplete: (value) ->
    return unless @props.onComplete?
    for i in [0...@props.mask.length]
      return if @_getPattern(i)? && @_buffer[i] is @_getFormatChar(i)

    @props.onComplete value

  _setValue: (value) ->
    @props.onChange?(target: {value}) if value isnt @state.value
    @setState {value}
    value

  _handleFocus: (e) ->
    setTimeout =>
      @_setSelection @_cursorPos
    , 0

    @props.onFocus?(e)

  _handleKeyDown: (e) ->
    if e.key is 'Backspace' || e.key is 'Delete'
      {begin, end} = @_getSelection()

      if begin is end
        if e.key is 'Delete'
          begin = @_seekNext(begin - 1)
          end = @_seekNext(begin)
        else
          begin = @_seekPrev(begin)

      @_shiftLeft(begin, end)
      @_setValue @_buffer.join('')

      e.preventDefault()

    @props.onKeyDown?(e)

  _handleKeyPress: (e) ->
    if e.key.length is 1
      {begin, end} = @_getSelection()
      @_cursorPos = begin
      bufferChanged = false

      if begin isnt end
        @_shiftLeft(begin, end)
        bufferChanged = true

      next = @_seekNext(@_cursorPos - 1)
      if next < @props.mask.length && @_getPattern(next).test(e.key)
        @_shiftRight(next)

        @_buffer[next] = e.key
        @_cursorPos = @_seekNext(next)
        value = @_setValue @_buffer.join('')
        @_callOnComplete value
      else if bufferChanged
        @_setValue @_buffer.join('')

      e.preventDefault()

    @props.onKeyPress?(e)

  _handleChange: (e) ->
    value = @_maskedValue e.target.value
    @_setValue value
    @_callOnComplete value

  _maskedValue: (input) ->
    for i in [0...@props.mask.length]
      break if @_buffer[i] isnt input[i]

    originalCursorPos = @_cursorPos = @_getSelection().begin
    inputPos = i
    for bufferPos in [i...@props.mask.length]
      pattern = @_getPattern(bufferPos)
      if pattern?
        @_buffer[bufferPos] = @_getFormatChar(bufferPos)
        while inputPos < input.length
          c = input[inputPos++]
          if pattern.test(c)
            @_buffer[bufferPos] = c
            break
          else if @_cursorPos > bufferPos
            @_cursorPos--
            # @_cursorPos ?= i

        if inputPos >= input.length
          @_resetBuffer(bufferPos + 1, @props.mask.length)
          break

      else
        @_cursorPos++ if inputPos <= originalCursorPos
        if @_buffer[bufferPos] is input[inputPos]
          inputPos++

    @_buffer.join('')

  _maskedValue2: (input) ->
    @_cursorPos = @_getSelection().begin
    start = 0
    diffs = jsdiff.diffChars(@state.value, input)

    for diff, i in diffs
      break if diff.added || diff.removed
      start += diff.value.length # count?

    for i in [i...diffs.length]
      diff = diffs[i]

      continue if diff.removed
      start = @_something(start, diff.value, diff.added)
      # start += diff.value.length

    @_buffer.join('')

  _something: (start, input, added) ->
    pos = 0
    for i in [start...@props.mask.length]
      pattern = @_getPattern(i)
      if pattern?
        @_buffer[i] = @_getFormatChar(i)
        while pos++ < input.length
          c = input[pos - 1]
          if pattern.test(c)
            @_buffer[i] = c
            break
          else if added
            @_cursorPos--

        if pos > input.length
          @_resetBuffer(i + 1, @props.mask.length)
          break

      else
        @_cursorPos++ if added
        if @_buffer[i] is input[pos]
          pos++

    i

module.exports = MaskedInput
