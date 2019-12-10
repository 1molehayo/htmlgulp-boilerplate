import $ from 'jquery';

const getToday = () => {
  return new Date().getFullYear();
};

$(document).ready(() => {
  $('#today').html(getToday());
});
