'use strict';

var React = window.React;
var MaskedInput = window.MaskedInput;

var demoNode = document.getElementById('demo');
function addInput(mask) {
  var label = mask;
  demoNode.appendChild(document.createTextNode(label));
  var container = document.createElement('div');
  demoNode.appendChild(container);

  React.render(
    React.createElement(MaskedInput, {mask: mask}),
    container
  );
}

addInput('99/99/9999');
