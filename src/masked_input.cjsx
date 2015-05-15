React = window?.React || require 'react'

MaskedInput = React.createClass
  displayName: 'MaskedInput'

  propTypes:
    mask: React.PropTypes.string
    format: React.PropTypes.string
    onChange: React.PropTypes.func
    onKeyDown: React.PropTypes.func
    onKeyPress: React.PropTypes.func
    onComplete: React.PropTypes.func

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
    value: @_buffer.join('')

  componentDidUpdate: ->
    @_setSelection(@_cursorPos) if @_cursorPos?

  render: ->
    props = {}
    if @props.mask?
      props.onChange = @_handleChange
      props.onKeyPress = @_handleKeyPress
      props.onKeyDown = @_handleKeyDown
      props.onFocus = @_handleFocus
      props.value =
        if @props.value? && @props.value isnt @state.value
          @_maskedValue(@props.value)
        else
          @state.value

    <input {...@props} {...props} />

  _translations:
    '9': /\d/
    'a': /[A-Za-z]/
    '*': /[A-Za-z0-9]/

  _getSelection: ->
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
    @_translations[@props.mask[idx]]

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
    @props.onChange?(target: {value})
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
    pos = 0
    for i in [0...@props.mask.length]
      pattern = @_getPattern(i)
      if pattern?
        @_buffer[i] = @_getFormatChar(i)
        while pos++ < input.length
          c = input[pos - 1]
          if pattern.test(c)
            @_buffer[i] = c
            break

        if pos > input.length
          @_resetBuffer(i + 1, @props.mask.length)
          break

      else if @_buffer[i] is input[pos]
        pos++

    @_cursorPos = i
    @_buffer.join('')

module.exports = MaskedInput
