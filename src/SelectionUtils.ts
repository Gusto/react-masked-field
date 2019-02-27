export function getSelection(node: HTMLInputElement) {
  return {
    start: node.selectionStart || 0,
    end: node.selectionEnd || 0,
  };
}

export function setSelection(node: HTMLInputElement, start: number, end: number) {
  node.setSelectionRange(start, end);
}
