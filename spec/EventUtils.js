import { getSelection, setSelection } from '../src/SelectionUtils';

export function simulateChange(wrapper, content) {
  const node = wrapper.getDOMNode();
  const { start, end } = getSelection(node);
  const newVal = node.value.substring(0, start) + content + node.value.substr(end);

  node.value = newVal;
  setSelection(node, start + content.length, start + content.length);
  wrapper.simulate('change');
}

export function simulateKeyPress(wrapper, key) {
  let defaultPrevented = false;
  wrapper.simulate('keyPress', {
    key,
    preventDefault: () => (defaultPrevented = true),
  });

  if (!defaultPrevented && key.length === 1) {
    simulateChange(wrapper, key);
  }
}

export function simulateTyping(wrapper, content) {
  content.split('').forEach(key => simulateKeyPress(wrapper, key));
}

export function simulateKeyDown(wrapper, key) {
  let defaultPrevented = false;
  wrapper.simulate('keyDown', {
    key,
    preventDefault: () => (defaultPrevented = true),
  });

  const node = wrapper.getDOMNode();

  if (!defaultPrevented) {
    const { start, end } = getSelection(node);
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
    wrapper.simulate('change');
  }
}

export function simulateFocus(wrapper) {
  const node = wrapper.getDOMNode();
  node.focus();
  wrapper.simulate('focus');
  setSelection(node, node.value.length, node.value.length);
  return new Promise(resolve => setTimeout(resolve, 0));
}

export function simulateBlur(wrapper) {
  wrapper.simulate('blur');
}
