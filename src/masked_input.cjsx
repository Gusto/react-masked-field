React = window?.React || require 'react'
{getSelection, setSelection} = require './selection_utils'

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
    valueLink: React.PropTypes.object

  getDefaultProps: ->
    format: '_'

  getInitialState: ->
    return null unless @props.mask?

    @_buffer =
      for char, idx in @props.mask
        if @_getPattern(idx)
          @_firstNonMaskIdx ?= idx
          @_getFormatChar(idx)
        else
          char

    @_cursorPos = @_firstNonMaskIdx

    # TODO: Any way we can do this in one pass?
    value: @_maskedValue(@_getPropsValue() || '')

  componentDidUpdate: ->
    @_setSelection(@_cursorPos) if @_cursorPos?

  componentDidMount: ->
    propsValue = @_getPropsValue()
    if @props.mask? && propsValue? && @state.value isnt propsValue
      @_callOnChange(@state.value)
      # @props.onChange(target: {value: @state.value})

  render: ->
    if @props.mask?
      props =
        onChange: @_handleChange
        onKeyDown: @_handleKeyDown
        onFocus: @_handleFocus
        value: @state.value
        valueLink: null
    else
      props = {}

    <input {...@props} {...props} />

  _getSelection: ->
    if @isMounted()
      getSelection(@getDOMNode())
    else
      {start: 0, end: 0}

  _setSelection: (start, end=start) ->
    setSelection(@getDOMNode(), start, end)

  _getPropsValue: ->
    if @props.valueLink? then @props.valueLink.value else @props.value

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

  _callOnChange: (value) ->
    if @props.valueLink?
      @props.valueLink.requestChange(value)
    else
      @props.onChange?(target: {value})

  _callOnComplete: (value) ->
    return unless @props.onComplete?
    for i in [0...@props.mask.length]
      return if @_getPattern(i)? && @_buffer[i] is @_getFormatChar(i)

    @props.onComplete value

  _setValue: (value) ->
    @_callOnChange(value) if value isnt @state.value
    @setState {value}

  _handleFocus: (e) ->
    setTimeout =>
      @_setSelection @_cursorPos
    , 0

    @props.onFocus?(e)

  # TODO: rename all start -> start
  _handleKeyDown: (e) ->
    if e.key is 'Backspace' || e.key is 'Delete'
      {start, end} = @_getSelection()

      if start is end
        start = if e.key is 'Delete' then @_seekNext(start - 1) else @_seekPrev(start)
        end = @_seekNext(start)

      pattern = @_getPattern(start)
      if pattern?.test(@_buffer[end])
        value = @_maskedValue(@state.value.substring(end), start)
      else
        @_resetBuffer(start, end)
        value = @_buffer.join('')

      @_setValue(value)
      @_cursorPos = Math.max(start, @_firstNonMaskIdx)

      e.preventDefault()

    @props.onKeyDown?(e)

  _handleChange: (e) ->
    value = @_maskedValue e.target.value
    @_setValue value
    @_callOnComplete value

  _maskedValue: (value, start=0) ->
    for i in [0...@props.mask.length - start]
      break if @_buffer[start + i] isnt value[i]

    originalCursorPos = @_cursorPos = @_getSelection().start
    valuePos = i
    for bufferPos in [start + i...@props.mask.length]
      pattern = @_getPattern(bufferPos)
      if pattern?
        @_buffer[bufferPos] = @_getFormatChar(bufferPos)
        while valuePos < value.length
          c = value[valuePos++]
          if pattern.test(c)
            @_buffer[bufferPos] = c
            break
          else if @_cursorPos > bufferPos
            @_cursorPos--

        if valuePos >= value.length
          @_resetBuffer(bufferPos + 1, @props.mask.length)
          break

      else
        @_cursorPos++ if valuePos <= originalCursorPos
        if @_buffer[bufferPos] is value[valuePos]
          valuePos++

    @_buffer.join('')

module.exports = MaskedInput
