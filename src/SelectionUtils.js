'use strict';

module.exports = {
  getSelection: function(node) {
    var start, end;
    if (node.setSelectionRange != null) {
      start = node.selectionStart;
      end = node.selectionEnd;
    }
    else {
      var range = document.selection.createRange();
      start = 0 - range.duplicate().moveStart('character', -100000);
      end = start + range.text.length;
    }

    return {start, end};
  },
  setSelection: function(node, start, end) {
    if (node.setSelectionRange != null) {
      node.setSelectionRange(start, end);
    }
    else {
      var range = node.createTextRange();
      range.collapse(true);
      range.moveEnd('character', start);
      range.moveStart('character', end);
      range.select();
    }
  }
};
