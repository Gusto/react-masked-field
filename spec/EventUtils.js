import TestUtils from 'react-dom/test-utils';
import {getSelection, setSelection} from '../src/SelectionUtils';

export function simulateChange(node, content) {
  const {start, end} = getSelection(node);
  const newVal = node.value.substring(0, start) + content + node.value.substr(end);

  node.value = newVal;
  setSelection(node, start + content.length, start + content.length);
  TestUtils.Simulate.change(node, {target: node});
}

export function simulateKeyPress(node, key) {
  let defaultPrevented = false;
  TestUtils.Simulate.keyPress(node, {
    key,
    preventDefault: () => (defaultPrevented = true)
  });

  if (!defaultPrevented && key.length === 1) {
    simulateChange(node, key);
  }
}

export function simulateTyping(node, content) {
  content.split('').forEach(key => simulateKeyPress(node, key));
}

export function simulateKeyDown(node, key) {
  let defaultPrevented = false;
  TestUtils.Simulate.keyDown(node, {
    key,
    preventDefault: () => (defaultPrevented = true)
  });

  if (!defaultPrevented) {
    const {start, end} = getSelection(node);
    const prevVal = node.value;
    let newVal;
    if (start === end) {
      if (key === 'Backspace') {
        newVal = prevVal.substring(0, start - 1) + prevVal.substr(end);
      } else if (key === 'Delete') {
        newVal = prevVal.substring(0, start) + prevVal.substr(end + 1);
      }
    } else {
      newVal = prevVal.substring(0, start) + prevVal.substr(end);
    }

    node.value = newVal;
    setSelection(node, start, start);
    TestUtils.Simulate.change(node, {target: node});
  }
}

export function simulateFocus(node) {
  node.focus();
  TestUtils.Simulate.focus(node);
  setSelection(node, node.value.length, node.value.length);
  return new Promise(resolve => setTimeout(resolve, 0));
}

export function simulateBlur(node) {
  TestUtils.Simulate.blur(node);
}
