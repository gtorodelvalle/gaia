/* globals CallsHandler, CallScreen, KeypadManager, LazyL10n */

/* exported ConferenceGroupHandler */

'use strict';

var ConferenceGroupHandler = (function() {
  var groupLine = document.getElementById('group-call');
  var groupLabel = document.getElementById('group-call-label');
  var fakeNumber = groupLine.querySelector('.fake-number');
  var groupDetails = document.getElementById('group-call-details');
  var groupDetailsHeader = groupDetails.querySelector('header');
  // FIXME/bug 1007148: Refactor duration element structure
  var groupDuration = document.querySelector('#group-call > .duration');
  var groupDurationChildNode = groupDuration.querySelector('span');
  var groupTotalDurationChildNode =
    groupDuration.querySelector('.total-duration');
  var mergeButton = groupLine.querySelector('.merge-button');
  mergeButton.onclick = function(evt) {
    if (evt) {
      evt.stopPropagation();
    }
    CallsHandler.mergeConferenceGroupWithActiveCall();
  };

  var telephony = window.navigator.mozTelephony;
  telephony.conferenceGroup.oncallschanged = onCallsChanged;
  telephony.conferenceGroup.onstatechange = onStateChange;
  telephony.conferenceGroup.onerror = onConferenceError;

  function onCallsChanged() {
    var calls = telephony.conferenceGroup.calls;
    CallScreen.updateCallsDisplay();
    if (!calls.length) {
      CallScreen.hideGroupDetails();
    }

    LazyL10n.get(function localized(_) {
      groupDetailsHeader.textContent = groupLabel.textContent =
        _('group-call', {n: calls.length});
    });

    // When hanging up phones on conferenceGroup.calls.length >= 2,
    // we need to update handledCalls here since conferenceGroup.oncallschanged
    // rather than telephony.oncallschanges raises.
    // In case of conferenceGroup.calls.length < 2, check should be performed
    // in onStateChange to ignore transitional oncallschanged events before
    // exiting.
    if (telephony.conferenceGroup.calls.length >= 2) {
      CallsHandler.checkCalls();
    }
  }

  function show() {
    groupLine.hidden = false;
    groupLine.classList.remove('ended');
    groupLine.classList.remove('held');
    groupDurationChildNode.textContent = null;
    CallScreen.createTicker(groupDuration);
    CallScreen.setCallerContactImage(null);
  }

  function end() {
    groupTotalDurationChildNode.textContent =
      groupDurationChildNode.textContent;
    LazyL10n.get(function localized(_) {
      groupDurationChildNode.textContent = _('callEnded');
    });
    groupLine.classList.add('ended');
    groupLine.classList.remove('held');
    KeypadManager.formatPhoneNumber('end', false, groupLabel, fakeNumber,
      document.querySelectorAll('#calls section:not([hidden])').length > 1);
    CallScreen.stopTicker(groupDuration);

    setTimeout(function(evt) {
      groupLine.hidden = true;
      CallScreen.updateCallsDisplay();
    }, CallScreen.callEndPromptTime);
  }

  function onStateChange() {
    switch (telephony.conferenceGroup.state) {
      case 'resuming':
      case 'connected':
        show();
        break;
      case 'held':
        groupLine.classList.add('held');
        break;
      case '':
        // Exiting conference call
        end();
        CallsHandler.checkCalls();
        break;
    }
  }

  function onConferenceError(evt) {
    LazyL10n.get(function localized(_) {
      var errorMsg;
      if (evt.name == 'addError') {
        errorMsg = _('conferenceAddError');
      } else {
        errorMsg = _('conferenceRemoveError');
      }
      CallScreen.showStatusMessage(errorMsg);
    });
  }
})();
