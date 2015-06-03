'use strict';

var React = window.React;
var MaskedField = window.MaskedField;

var demoNode = document.getElementById('demo');
function addField(label, mask) {
  var label = label + ' ' + mask;
  demoNode.appendChild(document.createTextNode(label));
  var container = document.createElement('div');
  demoNode.appendChild(container);

  React.render(
    React.createElement(MaskedField, {mask: mask}),
    container
  );
}

addField('Date', '99/99/9999');
addField('Phone number', '(999) 999-9999');
addField('SSN', '999-99-9999');
