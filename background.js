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


   var getP = function(parentPath, thisPath) {
      return (thisPath === "") ? "" : parentPath + thisPath + "/";
   }

   var getSuggestedPathsNew = function(pathTokens, bookmarkObject, parentPath) {
      console.log("Calling: [" + pathTokens + "] obj: " + bookmarkObject.title);
      if ((pathTokens.length === 1) && (pathTokens[0] === "")) {
         pathTokens = [];
      }
      // If no tokens, return this object and all children.
      // If one token:
      //   If perfect match with a kid, return call the kid after consuming token.
      //   Else all kids with partial prefix match.
      // If more than one tokens:
      //    Consume first token: if there is a perfect match kid, call self on kid and restTokens.
      var retPaths = [];
      var thisFullPath = getP(parentPath, bookmarkObject.title);
      if (pathTokens.length === 0) {
         // If not root, add self.
         if (bookmarkObject.id !== "0") {
            retPaths.push({con: thisFullPath,
               desc: thisFullPath});
         }
         // Add all children.
         for (var i = 0; i < bookmarkObject.children.length; i++) {
            retPaths.push({con: getP(thisFullPath, bookmarkObject.children[i].title),
               desc: getP(thisFullPath, bookmarkObject.children[i].title)});
         }
      } else if (pathTokens.length === 1) {
         for (var i = 0; i < bookmarkObject.children.length; i++) {
            if (pathTokens[0] === bookmarkObject.children[i].title) {
               return getSuggestedPathsNew([], bookmarkObject.children[i], thisFullPath);
            }
         }
         // Else suggest prefix matches.
         for (var i = 0; i < bookmarkObject.children.length; i++) {
            if (bookmarkObject.children[i].title.indexOf(pathTokens[0]) === 0) {
               retPaths.push({con:getP(thisFullPath, bookmarkObject.children[i].title),
                    desc: getP(thisFullPath, bookmarkObject.children[i].title)});
            }
         }
      } else {
         console.log("Condition this!");
         for (var i = 0; i < bookmarkObject.children.length; i++) {
            if (bookmarkObject.children[i].title === pathTokens[0]) {
               pathTokens.splice(0, 1);
               return getSuggestedPathsNew(pathTokens, bookmarkObject.children[i], thisFullPath);
            }
         }
      }
      return retPaths;
   }


   var getSuggestedPaths = function(path) {
      console.log("Paths for query: <" + path + "> Split as: " + path.split("/"));
      var retPaths = getSuggestedPathsNew(path.split("/"), bookmarks, "");
      var removeThings = [];
      for (var i = 0; i < retPaths.length; i++) {
          console.log(i + "[" + retPaths[i].con + "]" + "[" + retPaths[i].desc + "]");
         if ((retPaths[i].con === "") || (retPaths[i].desc === "")){
            removeThings.push(i);
            console.log("Remove" + i);
         }
      }
      for (var i = removeThings.length - 1; i >= 0; i--) {
         console.log(retPaths.splice(removeThings[i], 1));
      }
      for (var i = 0; i < retPaths.length; i++) {
         console.log(i + "[" + retPaths[i].con + "]" + "[" + retPaths[i].desc + "]");
      }
      return retPaths;
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
