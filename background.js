// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var qbm = function() {

   var bookmarks = "";
   var waiting = false;
   var currentText = "";
   var suggestFunctionDelayed;
   var defaultSuggestion = "";

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
      defaultSuggestion = suggestion;
      chrome.omnibox.setDefaultSuggestion(suggestion);
   }

   var treeLoader = function(bookmarkTree) {
      bookmarks = bookmarkTree[0];
      if (waiting) {
         waiting = false;
         setSuggestions();
      }
   }

   var reset = function() {
      setDefault(suggestion("", "Save Current In Bookmarks Bar"));
   }

   // When user starts to input, load bookmarks.
   var startHandler = function() {
      chrome.bookmarks.getTree(treeLoader);
   }

   // When the user accepts an option.
   var acceptHandler = function(text) {
      console.log("Accepted [" + text + "]");
      // TODO Handle command
   }


   var commandType = function(command, startsWith) {
      return command.toLowerCase().indexOf(startsWith.toLowerCase()) === 0;
   }

   var getAction = function(command) {
      if (commandType(command, "A")) {
         return {con: "A ", desc: "Add"};
      } else if (commandType(command, "L")) {
         return {con: "L ", desc: "Load"};
      }
      return {con: "A ", desc: "Add?"};
   }

   var getPath = function(command) {
      if (command.length <= 2) {
         return "";
      } else {
         return command.substring(2);
      }
   }

   var getSuggestedPaths = function(path) {
      var paths = [];
      console.log("Path [" + path + "]");
      for (var i = 0; i < bookmarks.children.length; i++) {
         paths.push({con: bookmarks.children[i].title,
            desc: bookmarks.children[i].title});
         console.log("SuggestedPath [" + bookmarks.children[i].title + "]");
      }
      return paths;
   }

   var setSuggestions = function() {
      if (bookmarks === "") {
         console.log("Waiting");
         waiting = true;
         return;
      }
      var suggestions = [];

      var action = getAction(currentText);
      var path = getPath(currentText);

      var suggestedPaths = getSuggestedPaths(path);

      for (var i = 0; i < suggestedPaths.length; i++) {
         suggestions.push(suggestion(action.con + suggestedPaths[i].con,
                  action.desc + " " + suggestedPaths[i].desc));
      }

      // TODO Populate Suggestions.
      suggestFunctionDelayed(suggestions);
   }

   return {
      init: function() {
         reset();
         chrome.omnibox.onInputStarted.addListener(startHandler());
         chrome.omnibox.onInputEntered.addListener(function(text) {
            acceptHandler(text);
         });
         chrome.omnibox.onInputChanged.addListener(function(text, suggestFn) {
            console.log(text);
            suggestFunctionDelayed = suggestFn;
            currentText = text;
            setSuggestions();
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
