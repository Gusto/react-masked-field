React = window?.React || require 'react'

MaskedInput = React.createClass
  displayName: 'MaskedInput'

  # TODO: Add _ for private methods?

  propTypes:
    mask: React.PropTypes.string
    format: React.PropTypes.string
    onChange: React.PropTypes.func
    onKeyDown: React.PropTypes.func
    onKeyPress: React.PropTypes.func
    onComplete: React.PropTypes.func

  getDefaultProps: ->
    # TODO: Maybe "fill"? or "fillWith"?
    format: '_'

  getInitialState: ->
    return null unless @props.mask?

    @buffer =
      for char, idx in @props.mask
        if @translations[char] # TODO: Should we just call getPattern instead of translations?
          @firstNonMaskIdx ?= idx
          @getFormat(idx)
        else
          char

    @cursorPos = @firstNonMaskIdx
    value: @buffer.join('')

  componentDidUpdate: ->
    @setCursorPos(@cursorPos) if @cursorPos?

  render: ->
    props = {}
    if @props.mask?
      props.onChange = @handleChange
      props.onKeyPress = @handleKeyPress
      props.onKeyDown = @handleKeyDown
      props.onFocus = @handleFocus
      props.value =
        # TODO: Is this right? Should the initial state transform the @props.value?
        if @props.value? && @props.value isnt @state.value
          @maskedValue(@props.value)
        else
          @state.value

    <input {...@props} {...props} />

  translations:
    '9': /\d/
    'a': /[A-Za-z]/
    '*': /[A-Za-z0-9]/

  # TODO: getSelection?
  getCursorPos: ->
    node = @getDOMNode()
    if node.setSelectionRange?
      begin = node.selectionStart
      end = node.selectionEnd
    else
      range = document.selection.createRange()
      begin = 0 - range.duplicate().moveStart 'character', -100000
      end = begin + range.text.length

    {begin, end}

  setCursorPos: (begin, end=begin) -> # TODO: Do we need begin and end?
    node = @getDOMNode()
    if node.setSelectionRange?
      node.setSelectionRange(begin, end)
    else
      range = node.createTextRange()
      range.collapse true
      range.moveEnd 'character', begin
      range.moveStart 'character', end
      range.select()

  getPattern: (idx) ->
    @translations[@props.mask[idx]]

  # TODO: getFormatChar? getFormatCharacter?
  getFormat: (idx) ->
    idx = if idx < @props.format.length then idx else 0
    @props.format[idx]

  clearBuffer: (start, end) ->
    @buffer[i] = @getFormat(i) for i in [start...end] when @getPattern(i)?
    true

  seekNext: (pos) ->
    # for idx in [pos+1...@props.mask.length]
    #   break if @getPattern(idx)?
    # idx
    true while ++pos < @props.mask.length && not @getPattern(pos)?
    pos

  seekPrev: (pos) ->
    # for idx in [pos-1...0]
      # break if @getPattern(idx)?
    # TODO: Not a big fan of this...
    true while --pos >= 0 && not @getPattern(pos)?
    pos

  shiftLeft: (begin, end) ->
    @clearBuffer(begin, end)
    return if begin < 0

    next = @seekNext(end - 1)
    for i in [begin...@props.mask.length]
      pattern = @getPattern(i)
      if pattern?
        if next < @props.mask.length && pattern.test(@buffer[next])
          @buffer[i] = @buffer[next]
          @buffer[next] = @getFormat(next)
        else
          break

        next = @seekNext(next)

    @cursorPos = Math.max(begin, @firstNonMaskIdx) # TODO: Right spot for this?
    # @cursorPos = i

  shiftRight: (pos) ->
    c = @getFormat(pos)
    for i in [pos...@props.mask.length]
      pattern = @getPattern(i)
      if pattern?
        next = @seekNext(i)
        t = @buffer[i]
        @buffer[i] = c
        if next < @props.mask.length && pattern.test(t)
          c = t
        else
          break
    true

  # TODO: callOnComplete?
  fireOnComplete: (value) ->
    return unless @props.onComplete?
    for i in [0...@props.mask.length]
      return if @getPattern(i)? && @buffer[i] is @getFormat(i)

    @props.onComplete value

  setValue: (value) ->
    @props.onChange?(target: {value})
    @setState {value}
    value

  handleFocus: (e) ->
    setTimeout =>
      @setCursorPos @cursorPos
    , 0

    @props.onFocus?(e)

  handleKeyDown: (e) ->
    if e.key is 'Backspace' || e.key is 'Delete'
      {begin, end} = @getCursorPos()

      if begin is end
        if e.key is 'Delete'
          begin = @seekNext(begin - 1)
          end = @seekNext(begin)
        else
          begin = @seekPrev(begin)

      @shiftLeft(begin, end)
      @setValue @buffer.join('')

      e.preventDefault()

    @props.onKeyDown?(e)

  handleKeyPress: (e) ->
    if e.key.length is 1
      {begin, end} = @getCursorPos()
      @cursorPos = begin
      bufferChanged = false

      if begin isnt end
        @shiftLeft(begin, end)
        bufferChanged = true

      next = @seekNext(@cursorPos - 1)
      if next < @props.mask.length && @getPattern(next).test(e.key)
        @shiftRight(next)

        @buffer[next] = e.key
        @cursorPos = @seekNext(next)
        value = @setValue @buffer.join('')
        @fireOnComplete value
      else if bufferChanged
        @setValue @buffer.join('')

      e.preventDefault()

    @props.onKeyPress?(e)

  handleChange: (e) ->
    value = @maskedValue e.target.value
    @setValue value
    @fireOnComplete value

  maskedValue: (input) ->
    pos = 0
    for i in [0...@props.mask.length]
      pattern = @getPattern(i)
      if pattern?
        @buffer[i] = @getFormat(i)
        while pos++ < input.length
          c = input[pos - 1]
          if pattern.test(c)
            @buffer[i] = c
            break

        if pos > input.length
          @clearBuffer(i + 1, @props.mask.length)
          break

      else if @buffer[i] is input[pos]
        pos++

    @cursorPos = i
    @buffer.join('')

module.exports = MaskedInput
