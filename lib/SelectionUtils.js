'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getSelection = getSelection;
exports.setSelection = setSelection;
function getSelection(node) {
  var start = undefined;
  var end = undefined;
  if (node.setSelectionRange) {
    start = node.selectionStart;
    end = node.selectionEnd;
  } else {
    var range = document.selection.createRange();
    start = 0 - range.duplicate().moveStart('character', -100000);
    end = start + range.text.length;
  }

  return { start: start, end: end };
}

function setSelection(node, start, end) {
  if (node.setSelectionRange) {
    node.setSelectionRange(start, end);
  } else {
    var range = node.createTextRange();
    range.collapse(true);
    range.moveEnd('character', start);
    range.moveStart('character', end);
    range.select();
  }
}