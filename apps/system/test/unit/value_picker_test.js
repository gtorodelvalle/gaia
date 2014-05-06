'use strict';

mocha.globals(['ValuePicker']);

requireApp('system/js/value_selector/value_picker.js');

suite('value selector/value picker', function() {
  var subject;
  var stubByQuery;

  teardown(function() {
    stubByQuery.restore();
  });

  setup(function() {
    stubByQuery = this.sinon.stub(document, 'querySelector')
                       .returns(document.createElement('div').
                                  appendChild(document.createElement('div')));

    // month value picker
    var monthUnitStyle = {
      valueDisplayedText: ['January', 'February', 'March', 'April', 'May',
                           'June', 'July', 'August', 'September', 'October',
                           'November', 'December'],
      className: 'value-picker-month'
    };

    var monthPickerContainer =
      document.querySelector('.value-picker-month');
    subject = new ValuePicker(monthPickerContainer, monthUnitStyle);
  });

  test('called querySelector', function() {
    assert.isTrue(stubByQuery.withArgs('.value-picker-month').calledOnce);
    assert.isFalse(stubByQuery.withArgs('.value-picker-year').calledOnce);
  });

  test('getSelectedIndex', function() {
    subject._currentIndex = 2;
    assert.equal(subject.getSelectedIndex(), 2);
  });

  test('getSelectedDisplayedText', function() {
    assert.equal(subject.getSelectedDisplayedText(), 'January');
  });

  test('setSelectedDisplayedText', function() {
    subject._currentIndex = 3;
    assert.equal(subject.getSelectedDisplayedText(), 'April');
  });

  test('setRange', function() {
    subject.setRange(0, 11);
    assert.equal(subject._lower, 0);
    assert.equal(subject._upper, 11);
  });
});
