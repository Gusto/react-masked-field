module.exports =
  getSelection: (node) ->
    if node.setSelectionRange?
      begin = node.selectionStart
      end = node.selectionEnd
    else
      range = document.selection.createRange()
      begin = 0 - range.duplicate().moveStart 'character', -100000
      end = begin + range.text.length

    {begin, end}

  setSelection: (node, begin, end) ->
    if node.setSelectionRange?
      node.setSelectionRange(begin, end)
    else
      range = node.createTextRange()
      range.collapse true
      range.moveEnd 'character', begin
      range.moveStart 'character', end
      range.select()
