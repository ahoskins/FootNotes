# :speech_balloon: FootNotes

**[soundcloud-style](https://soundcloud.com/kanyewest/nomorepartiesinla) time-tied comments for youtube**

Comment on videos for personal records, or share in realtime with friends.  FootNotes is a chrome extension that was made during UAlberta's [HackED 2016](http://eceweek.compeclub.com/hackathon/).  

This project is currently under further development &mdash; ideas, praise, critique is appreciated.  Just open an issue.

Demo
---

After installing, setup the hotkey in chrome://extension.  When watching a youtube video activate FootNotes by typing in the hotkey.  A small banner will appear on the bottom of the youtube webpage &mdash; comment on the left, share on the right.  

![demo](https://cloud.githubusercontent.com/assets/1527504/13029514/039362ec-d24c-11e5-823a-618ddbc81d81.gif)

Install
-----
[Chrome webstore](https://chrome.google.com/webstore/detail/footnotes/nckdagfbgjenfpmjcdcnmaonehfkkjoh/related)

**OR**

From source (for development):

Clone, install deps, and build:

    $ git clone https://github.com/ahoskins/FootNotes.git && cd FootNotes
    $ npm install
    $ webpack -d --progress --watch

Load into chrome:

1. in chrome://extensions select "load unpacked extension" (make sure developer mode is checked)
2. set the hotkey (bottom of chrome://extensions)

How it Works
------
Comments are stored in [chrome.storage.sync](https://developer.chrome.com/extensions/storage), a special partition of localstorage for the chrome user account.  This means that by signing into your chrome account on any machine the FootNotes time-tied comments will be there.  

Instead of using peer-to-peer (like WebRTC), sharing is done with a small backend (closed source) that uses [socket.io](http://socket.io/).  This means sharing is realtime when both users are online, but also works when only one is online because the backend buffers the shared comments in MongoDB.  Once comments are transferred to the receiver, they are deleted from the database.

Extensions (just like the developer console) have full access to a webpage's DOM, but not the running JavaScript.  To get the youtube video's current playtime, FootNotes injects code into youtube.com.  Injected code has the same privilages as code that was there from the beginning, so this injected code is FootNotes' inside agent for things like current playtime and total video length.





