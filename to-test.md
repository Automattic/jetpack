## 7.7

### Jetpack Connection

In this release, we've made multiple changes to the connection process in order to make more reliable. Do not hesitate to report any issues you may experience when you connect your test site to WordPress.com.

### Jetpack Videos

We've added extra settings to the Video block. To test this, try the following:

- Go to Media > Library and upload a video.
- Purchase a paid plan
- Enable the Video option under Jetpack > Settings > Performance
- Go to Media > Library and upload a video.
- Once it's converted, go to Posts > Add New.
- In that new post, look for **the Video block**.
- Look for the first video you've uploaded first, and try to use any of the settings in the block sidebar. Make sure they work well.
- Then, insert an additional block with the second video, uploaded using Jetpack Videos. The video preview should use the Jetpack Video player, but the block sidebar options should still be there and work.

**Note**: some browsers do not respect the autoplay settings, so that setting may not work in all browsers.

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticible and report anything you see.

**Thank you for all your help!**
