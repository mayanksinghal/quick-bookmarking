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
         return {con: "A ", desc: "<match>Add</match> <dim>to</dim>"};
      } else if (commandType(command, "L")) {
         return {con: "L ", desc: "<match>Load</match> <dim>to</dim>"};
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

   /**
    * Returns suggestion corresponding to a folder.
    */
   var addFolder = function(folder) {
      return {
         con: espaceTitle(folder.title),
         desc: folder.title
      };
   }

   var escapeTitle = function(title) {
      return (title.indexOf("/" >= 0)) ? "\"" + title + "\"" : title;
   }

   var getSuggestedPaths = function(path) {
      return getSuggestedPathsHelper(path, bookmarks, "");
   }

   var getChildrenPaths = function(folder, parentPath) {
      var retPaths = [];
      for (var i = 0; i < folder.children.length; i++) {
         if (!folder.children[i].hasOwnProperty("url")) {
            retPaths.push({con: parentPath + escapeTitle(folder.children[i].title),
                     desc: parentPath + folder.children[i].title});
         }
      }
      return retPaths;
   }

   var getSuggestedPathsHelper = function(path, folder, parentPath) {
      console.log("GetPaths for [" + path + "] [" + parentPath + "]");
      if (path === "") {
         return getChildrenPaths(folder, parentPath);
      }
      var thisFolder = path.split("/", 1)[0];
      var restPath = (thisFolder === path) ? "" : path.substring(thisFolder.length);
      if (restPath.indexOf("/") === 0) {
         restPath = restPath.substring(1);
      }
      var thisFolderUnquoted = thisFolder;
      if ((thisFolder.indexOf("\"") === 0) && (thisFolder.lastIndexOf("\"") === thisFolder.length - 1)) {
         thisFolderUnquoted = thisFolder.substring(1, thisFolder.length - 1);
      }
      console.log("  " + thisFolder + " " + thisFolderUnquoted + " " + thisFolder.indexOf("\"") + " " + thisFolder.lastIndexOf("\"") + " " + thisFolder.length);
      for (var i = 0; i < folder.children.length; i++) {
         if (folder.children[i].title === thisFolderUnquoted) {
            return getSuggestedPathsHelper(restPath, folder.children[i], parentPath + thisFolder + "/");
         }
      }
      return [];
   }

   var setSuggestions = function() {
      if (bookmarks === "") {
         waiting = true;
         return;
      }
      var suggestions = [];

      var action = getAction(currentText);
      var path = getPath(currentText);

      console.log("Path [" + path + "]");
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
         chrome.omnibox.onInputStarted.addListener(function() {
            chrome.bookmarks.getTree(treeLoader);
         });
         chrome.omnibox.onInputEntered.addListener(function(text) {
            acceptHandler(text);
         });
         chrome.omnibox.onInputChanged.addListener(function(text, suggestFn) {
            suggestFunctionDelayed = suggestFn;
            currentText = text;
            setSuggestions();
         });
     }
   }
} ();
qbm.init();
