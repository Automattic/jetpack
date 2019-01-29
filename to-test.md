## 7.0

### AMP

Once again we've made some changes to ensure that Jetpack plays well with the AMP plugin. To test, try the following:

* Install the AMP plugin.
* Switch AMP mode (AMP > General) to `Paired` or `Classic`.
* Activate the Carousel module, the sharing module, and ensure that `SCRIPT_DEBUG` is set to `false` on your install.
* Create a post with a gallery
* Add a Facebook sharing button to that post.
* Share that post on Facebook once.
* Comment on one of the images in the gallery.
* Load the post in a non-AMP view, and in the 3 modes available in the AMP options screen: Native, Paired, Classic. (`Native` mode -  all views are AMP views; `Paired` mode - add `?amp` to get to the AMP view; `Classic` mode - add `/amp` to get to the AMP view)
	-  **In non-AMP views:** Does the Carousel modal work? Do you see the comment in the Carousel modal? Do you see the sharing buttons? Do you see the counter next to the sharing button? Do you see the `jetpack.css` file when viewing source?
	- **In AMP views:** you should not see the Carousel. You should see a special styling of the sharing buttons. If you check the network tab in your browser tools, you should see a request to pixel.wp.com when logged out. You should not see a `jetpack.css` file in the source.

In all cases:
- You should not see any js errors in the browser console.
- You should not get any PHP notices in your debug log.

Now try adding the following to a functionality plugin on your site:

```php
add_filter( 'jetpack_implode_frontend_css', '__return_false' );
add_filter( 'jetpack_sharing_counts', '__return_false' );
```

Once you've done so, check the non-AMP view again:
- you should not see the sharing counter on the Facebook button.
- you should not see the `jetpack.css` file in your source.

### Block Editor

This release adds one more block to the list of blocks available in Jetpack. The Gif block will allow you to quickly search and add images to your posts. To test it, load the block editor and search for the new Gif block. You should then be able to search for images using any keyword, choose an image, and add a caption if you want to. The image should be displayed nicely on the front end of your site.

### Copy A Post

This release introduces a brand new feature, "Copy Post". The feature is not activated by default, so you'll need to go Jetpack > Settings, search for the feature, and activate it. Once you've done so, here is how you can test the feature:

- Create a test post that has the following: title, content, except, featured image, post format, categories, and tags (be sure the theme supports Post Formats, like Twenty Seventeen; Twenty Nineteen does not).
- From `/wp-admin/edit.php`, hover over the test post and then click Copy.
- Verify the draft post that loads contains all of the data from the existing post.
- Publish, and verify all information was saved without errors.
- Repeat the same with pages and a custom post type.

### Publicize

With Google+ being sunset in a month, it's time for us to mention this in the interface. If you go to Settings > Sharing in your dashboard, or try to publish a new post on a site you had previously connected to Google+, you will now see a notice in the Publicize settings, to let you know about the upcoming change. In Settings > Sharing, you should not be able to create a new connection anymore.

### Others

**At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**

**Thank you for all your help!**
