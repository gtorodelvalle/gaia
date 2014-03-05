var Contacts = require('./lib/contacts');
var Dialer = require('../../../dialer/test/marionette/lib/dialer');
var assert = require('assert');

marionette('Contacts > Form', function() {
  var client = marionette.client(Contacts.config),
    subject,
    dialerSubject,
    selectors;

  setup(function() {
    subject = new Contacts(client);
    selectors = Contacts.Selectors;
    dialerSubject = new Dialer(client);
    dialerSelectors = Dialer.Selectors;
    subject.launch();
  });

  suite('Click phone number', function() {
    test('Add a simple contact', function() {
      var givenName = 'Hello';
      var familyName = 'World';

      subject.addContact({
        givenName: givenName,
        familyName: familyName
      });

      var listView = client.helper.waitForElement(selectors.list);
      assert.ok(listView.displayed(), 'List view is shown.');

      var listElementText = client.helper
        .waitForElement(selectors.listContactFirst)
        .text();

      assert.notEqual(listElementText.indexOf(givenName), -1);
      assert.notEqual(listElementText.indexOf(familyName), -1);
    });

    test('Can create custom label', function() {
      subject.addContact({
        givenName: 'Custom Label Test',
        tel: 1231231234
      });

      client.helper.waitForElement(selectors.listContactFirstText)
        .click();

      subject.waitSlideLeft('details');

      client.helper.waitForElement(selectors.detailsEditContact)
        .click();

      subject.waitForFormShown();

      client.helper.waitForElement(selectors.formTelLabelFirst)
        .click();

      subject.waitSlideLeft('formCustomTagPage');

      client.helper.waitForElement(selectors.formCustomTag)
        .sendKeys('BFF');

      client.helper.waitForElement(selectors.formCustomTagDone)
        .click();

      // Wait for the custom tag page to disappear
      var bodyWidth = client.findElement(selectors.body).size().width;
      client.waitFor(function waiting() {
        var tagPage = client.findElement(selectors.formCustomTagPage);
        var location = tagPage.location();
        return location.x >= bodyWidth;
      });

      client.findElement(selectors.formSave)
        .click();

      subject.waitForFormTransition();
      client.helper.waitForElement(selectors.detailsTelLabelFirst);
      client.waitFor(function waiting() {
        var label = client.findElement(selectors.detailsTelLabelFirst).text();
        return label === 'BFF';
      });
      assert.ok(true, 'custom label is updated.');
    });
  });

  suite('Facebook contacts', function() {
    test('Add phone number from Dialer to existing Facebook contact',
      function() {
        var tel = '+34666666666',
            email = 'gtorodelvalle@hotmail.com';

        var saveFBContact = function(tel, email) {
          var fb = window.wrappedJSObject.fb;

          var fbContactData = {
            'uid': '100007887283166',
            'name': 'Jander Klander',
            'pic_big': 'https://fbcdn-profile-a.akamaihd.net/static-ak/' +
              'fbrsrc.php/v2/yL/r/HsTZSDw4avx.gif',
            'current_location': null,
            'email': [{
              'type': ['other'],
              'value': email
        }],
            'profile_update_time': 1393974966,
            'work': [],
            'hometown_location': null,
            '_idxFriendsArray': 124,
            'familyName': ['Klander'],
            'additionalName': '',
            'givenName': ['Jander'],
            'tel': [{
              'type': ['other'],
              'value': tel
          }],
            'email1': email,
            'contactPictureUri': 'https://graph.facebook.com/100007887283166/' +
              'picture?type=square&width=120&height=120',
            'search': 'JanderKlander' + email,
            'picwidth': 120,
            'picheight': 120,
            '_idx_': 0,
            'fbInfo': {
              'org': [''],
              'adr': [],
              'shortTelephone': [tel.slice(3)],
              'url': [{
                'type': ['fb_profile_photo'],
                'value': 'https://fbcdn-profile-a.akamaihd.net/static-ak/' +
                  'rsrc.php/v2/yL/r/HsTZSDw4avx.gif'
          }]
            }
          };

          var fbContact = new fb.Contact();
          fbContact.setData(fbContactData);

          var savingFBContact = fbContact.save();

          savingFBContact.onsuccess = function() {
            marionetteScriptFinished(true);
          };

          savingFBContact.onerror = function() {
            marionetteScriptFinished(false);
          };
        };

        var isFBContactSaved = false;
        client.executeAsyncScript(saveFBContact, [tel, email],
          function(err, val) {
          isFBContactSaved = val;
        });

        client.waitFor(function() {
          return isFBContactSaved;
        });

        client.apps.close(Contacts.URL, 'contacts');

        dialerSubject.launch();

        var one = client.findElement(dialerSelectors.one),
            two = client.findElement(dialerSelectors.two),
            three = client.findElement(dialerSelectors.three);
        for (var i = 0; i < 3; i++) {
          one.tap();
          two.tap();
          three.tap();
        }
        var phoneNumber = dialerSubject.client.findElement(
          dialerSelectors.phoneNumber);
        client.waitFor(function() {
          return (phoneNumber.getAttribute('value').length === 9);
        });

        var addContact = dialerSubject.client.findElement(
          dialerSelectors.keypadCallBarAddContact);
        addContact.tap();

        var addToExistingContact = dialerSubject.client.helper.waitForElement(
          dialerSelectors.addToExistintContactMenuItem);
        addToExistingContact.tap();

        client.switchToFrame();
        client.apps.switchToApp(Contacts.URL, 'contacts');

        client.findElement(selectors.listContactFirst).tap();

        subject.waitForFormShown();

        var formTelNumberSecond = client.helper.waitForElement(
          selectors.formTelNumberSecond);
        var formEmailFirst = client.helper.waitForElement(
          selectors.formEmailFirst);

        assert.equal(formTelNumberSecond.getAttribute('value'),
               tel);
        assert.equal(formEmailFirst.getAttribute('value'),
               email);
      });
  });
});
