## Jetpack 10.9

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Jetpack connection sharing

We improved how Jetpack shares the connection with Jetpack standalone plugins.

-Connect Jetpack
-Activate a secondary plugin like Boost and/or Backup
-Go to Plugins
-Confirm the link to deactivate Jetpack says only "Deactivate" (and not 'Disconnect and Deactivate')
-Click Deactivate
-Confirm the dialog shows information about the active features you have and no mention to other plugins
-Reconnect Jetpack and try disabling standalone plugins
-Make sure disconnecting from the Jetpack Dashboard still works

### Lazy load

We added Lazy Load option to the Instagram Latest Post block and improved support for Lazy Load on block based themes

For Instagram Latest Posts block:

-Add a Instagram Latest Posts block to a test post
-Place a large spacer block above the Instagram one to test the lazy load aspect.
-Inspect the HTML of the block images to see that they contain the lazy attribute.
-If you inspect the network tab in the browser tools, the images should load in lazily on page scroll.

For the block based themes:
-Make sure you are using a block based theme such as Twenty-Twenty Two
-Create a post with a core gallery block, and insert a few images. You can add a spacer block above this block with say 1000px spacing to force the images far enough off the browser viewport.
-Inspect the page elements, and make sure the post content image elements contain the Jetpack lazy load metadata like the `jetpack-lazy-image` class.


### VideoPress

We added support for automatic seekbar color.

-Enable VideoPress on your site 
-In your media library, add a VideoPress video and, when uploaded,copy the GUID.
-Create a new postand add a shortcode block `[wpvideo <replace with your guid> useAverageColor=true]`
-Play the video. The seekbar should change its color automatically during video playback.
-Edit the shortcode and set the `useAverageColor` to `false`
-Save and play video. The seekbar should not change its color anymore.

**Thank you for all your help!**
