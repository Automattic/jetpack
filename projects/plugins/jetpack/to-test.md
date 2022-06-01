## Jetpack 10.11

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Jetpack connection sharing

We improved how Jetpack shares the connection with Jetpack standalone plugins. To test this, try the following:

- Connect Jetpack.
- Activate a secondary plugin like Boost and/or Backup.
- Go to Plugins.
- Confirm the link to deactivate Jetpack says only "Deactivate" (and not 'Disconnect and Deactivate').
- Click Deactivate.
- Confirm the dialog shows information about the active features you have and no mention to other plugins.
- Reconnect Jetpack and try disabling standalone plugins.
- Make sure disconnecting from the Jetpack Dashboard still works.

### Lazy load

We added Lazy Load option to the Instagram Latest Post block and improved support for Lazy Load on block based themes

You can test this out with the Latest Instagram Posts Block:

- Add a Latest Instagram Posts block to a test post
- Place a large spacer block above the Instagram one to test the lazy load aspect.
- Inspect the HTML of the block images to see that they contain the lazy attribute.
- If you inspect the network tab in the browser tools, the images should load in lazily on page scroll.

For the block based themes:

- Make sure you are using a block based theme such as Twenty-Twenty Two
- Create a post with a core gallery block, and insert a few images. You can add a spacer block above this block with say 1000px spacing to force the images far enough off the browser viewport.
- Inspect the page elements, and make sure the post content image elements contain the Jetpack lazy load metadata like the `jetpack-lazy-image` class.

### Publicize

We've made multiple under-the-hood changes to the Publicize feature to prepare for the first release of the Jetpack Social plugin. The feature should continue to work just like before for Jetpack plugin users. Please try to use the Publicize feature to share posts to Twitter, Facebook, et al., and try using Publicize's Twitter Thread feature as well.

### Sharing

We've made some changes to the Email Sharing button in this release. It now fully relies on the email client or service you use on your computer, instead of trying to send out emails from your server. To test the changes, try the following:

1. Go to Jetpack > Settings > Sharing and ensure that the sharing buttons are active.
2. Go to Settings > Sharing and add an email sharing button to your site.
3. Visit one of your posts, and try clicking the button.

Let us know if you run into any issues!


### VideoPress

We added support for automatic seekbar color.

- Enable VideoPress on your site 
- In your media library, add a VideoPress video and, when uploaded,copy the GUID.
- Create a new postand add a shortcode block `[wpvideo <replace with your guid> useAverageColor=true]`
- Play the video. The seekbar should change its color automatically during video playback.
- Edit the shortcode and set the `useAverageColor` to `false`
- Save and play video. The seekbar should not change its color anymore.

**Thank you for all your help!**
