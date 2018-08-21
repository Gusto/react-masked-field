import {  ReactWrapper } from 'enzyme';
import { getSelection, setSelection } from '../src/SelectionUtils';

const inputNode = (wrapper: ReactWrapper) => wrapper.find('input').getDOMNode() as HTMLInputElement;

export function simulateChange(wrapper: ReactWrapper, content: string) {
  const node = inputNode(wrapper);
  const { start, end } = getSelection(node);
  const newVal = node.value.substring(0, start) + content + node.value.substr(end);

  node.value = newVal;
  setSelection(node, start + content.length, start + content.length);
  wrapper.simulate('change');
}

export function simulateKeyPress(wrapper: ReactWrapper, key: string) {
  let defaultPrevented = false;
  wrapper.simulate('keyPress', {
    key,
    preventDefault: () => {
      defaultPrevented = true;
    },
  });

  if (!defaultPrevented && key.length === 1) {
    simulateChange(wrapper, key);
  }
}

export function simulateTyping(wrapper: ReactWrapper, content: string) {
  content.split('').forEach(key => simulateKeyPress(wrapper, key));
}

export function simulateKeyDown(wrapper: ReactWrapper, key: string) {
  let defaultPrevented = false;
  wrapper.simulate('keyDown', {
    key,
    preventDefault: () => {
      defaultPrevented = true;
    },
  });

  const node = inputNode(wrapper);

  if (!defaultPrevented) {
    const { start, end } = getSelection(node);
    const prevVal = node.value;
    let newVal = '';
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

export function simulateFocus(wrapper: ReactWrapper) {
  const node = inputNode(wrapper);
  node.focus();
  wrapper.simulate('focus');
  setSelection(node, node.value.length, node.value.length);
  return new Promise(resolve => setTimeout(resolve, 0));
}

export function simulateBlur(wrapper: ReactWrapper) {
  wrapper.simulate('blur');
}
