'use strict';

var React = require('react');
var $ = window.$;
var MaskedField = require('react-masked-field');
var Project1 = require('./react-masked-field');

$(document).ready(function() {
  $('li.tab').bind('click', function() {
    $('.project-detail').each(function() {
      $(this).addClass('hidden');
    });

    var id = $(this).attr('id');
    $('#project-' + id).removeClass('hidden');
  });

  function handleComplete(date) {
    console.log('Date is ' + date);
  }

  React.render(
		<MaskedField mask="99/99/9999" />,
    $('.react-masked-field-demo')[0]
  );

  React.render(<Project1/>, $('.project-description')[0]);
});
