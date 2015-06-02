'use strict';

var TestUtils = require('react/lib/ReactTestUtils');
var {getSelection, setSelection} = require('../src/SelectionUtils');

function simulateChange(node, content) {
  var {start, end} = getSelection(node);
  var newVal = node.value.substring(0, start) + content + node.value.substr(end);

  node.value = newVal;
  setSelection(node, start + content.length, start + content.length);
  TestUtils.Simulate.change(node, {target: node});
}

function simulateKeyPress(node, key) {
  var defaultPrevented = false;
  TestUtils.Simulate.keyPress(node, {
    key,
    preventDefault: () => defaultPrevented = true
  });

  if (!defaultPrevented && key.length === 1) {
    simulateChange(node, key);
  }
}

function simulateTyping(node, content) {
  content.split('').forEach(key => simulateKeyPress(node, key));
}

function simulateKeyDown(node, key) {
  var defaultPrevented = false;
  TestUtils.Simulate.keyDown(node, {
    key,
    preventDefault: () => defaultPrevented = true
  });

  if (!defaultPrevented) {
    var {start, end} = getSelection(node);
    var prevVal = node.value;
    if (start === end) {
      if (key === 'Backspace') {
        var newVal = prevVal.substring(0, start - 1) + prevVal.substr(end);
      }
      else if (key === 'Delete') {
        var newVal = prevVal.substring(0, start) + prevVal.substr(end + 1);
      }
    }
    else {
      newVal = prevVal.substring(0, start) + prevVal.substr(end);
    }

    node.value = newVal;
    setSelection(node, start, start);
    TestUtils.Simulate.change(node, {target: node});
  }
}

module.exports = {
  simulateChange,
  simulateKeyPress,
  simulateTyping,
  simulateKeyDown
};
