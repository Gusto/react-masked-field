$(document).ready(function(){

$('li.tab').bind('click',function(){
		$('.project-detail').each(function(){
		$(this).addClass('hidden');
});
		
var id = $(this).attr('id');
		$('#project-'+id).removeClass('hidden');
});

var MaskedField = window.MaskedField;

function handleComplete(date) {
  console.log('Date is ' + date);
}

React.render(
  React.createElement(MaskedField, {mask: '99/99/9999'}),
  $('.react-masked-field-demo')[0]
);

});