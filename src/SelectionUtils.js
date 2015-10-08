module.exports = {
  getSelection(node) {
    let start;
    let end;
    if (node.setSelectionRange) {
      start = node.selectionStart;
      end = node.selectionEnd;
    } else {
      const range = document.selection.createRange();
      start = 0 - range.duplicate().moveStart('character', -100000);
      end = start + range.text.length;
    }

    return {start, end};
  },
  setSelection(node, start, end) {
    if (node.setSelectionRange) {
      node.setSelectionRange(start, end);
    } else {
      const range = node.createTextRange();
      range.collapse(true);
      range.moveEnd('character', start);
      range.moveStart('character', end);
      range.select();
    }
  }
};
