// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var qbm = function() {

   var bookmarks = {};

   var suggestion = function(content, description) {
      if (content === "") {
         return {
            description: description
         }
      } else {
        return {
            content: content,
            description: description
         };
      }
   }

   var setDefault = function(suggestion) {
      chrome.omnibox.setDefaultSuggestion(suggestion);
   }

   var reset = function() {
      setDefault(suggestion("", "Save Current In Bookmarks Bar"));
   }

   // When user starts to input, load bookmarks.
   var startHandler = function() {
      // TODO Load Bookmarks to bookmarks var
   }

   // When the user accepts an option.
   var acceptHandler = function(text) {
      console.log("Accepted [" + text);
      // TODO Handle command
   }

   var getSuggestions = function(text) {
      return [];
   }

   return {
      init: function() {
         reset();
         chrome.omnibox.onInputStarted.addListener(startHandler());
         chrome.omnibox.onInputEntered.addListener(function(text) {
            acceptHandler(text);
         });
         chrome.omnibox.onInputChanged.addListener(function(text, suggestFn) {
            suggestFn(getSuggestions(text));
         });
      }
   }
} ();
qbm.init();

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {

  }
);

chrome.omnibox.onInputStarted.addListener(function() {

});

chrome.omnibox.onInputCancelled.addListener(function() {

});

chrome.omnibox.onInputEntered.addListener(function(text) {

});
