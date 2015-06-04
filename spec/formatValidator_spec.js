'use strict';

var formatValidator = require('../src/formatValidator');
var expect = require('chai').expect;

describe('formatValidator', function () {
  var props;
  var validate = () => formatValidator(props, 'format', 'MaskedField');

  function itReturnsNull() {
    it('returns null', () => expect(validate()).to.be.null);
  }

  function itReturnsError() {
    it('returns an Error', () => expect(validate()).to.be.instanceof(Error));
  }

  beforeEach(() => props = {});

  context('when the format prop is present', function() {
    context('when the format prop is not a string', function () {
      beforeEach(() => props.format = 3);

      itReturnsError();
    });

    context('when the format prop is a string', function () {
      beforeEach(() => props.format = 'hi');

      context('when a mask prop is present', function () {
        beforeEach(() => props.mask = 'hello');

        context('when the format length is 1', function() {
          beforeEach(() => props.format = '#');

          itReturnsNull();
        });

        context('when the format length matches the mask length', function() {
          beforeEach(() => props.format = '12345');

          itReturnsNull();
        });

        context('when the format length is 0', function() {
          beforeEach(() => props.format = '');

          itReturnsError();
        });

        context('when the format length does not match the mask length', function() {
          beforeEach(() => props.format = 'bye');

          itReturnsError();
        });
      });

      context('when the mask prop is not present', function () {
        itReturnsNull();
      });
    });
  });

  context('when the format prop is not present', function() {
    itReturnsNull();
  });
});
