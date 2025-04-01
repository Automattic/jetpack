## Jetpack 14.5

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`
	- To test Breve further in the document please enable the feature with the following snippet: `add_filter( 'breve_enabled', '__return_true' );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Alt text and caption generation tools

The image block extension now has alt text and caption generation options via Jetpack AI.

1. In the block editor, add an image block.
2. You should be able to see the AI stars icon, which should be disabled because the block has no image selected yet.
3. Add an image to the block. It can be from your media library, external or generated (the source should not matter).
4. The AI stars icon should be enabled now, and you can click on "Generate alt text" or "Generate caption".
5. The selected option will have its icon changed to a spinner while the generation is happening. The generation is not streamed, so it can take some seconds to finish.
6. After finishing, the caption should be visible with the image, whereas the alt text is displayed in the block sidebar only.
7. Try also with a private site. If a site is set to private and its images cannot be accessed publicly by OpenAI, the generation should still work, though it is going to take longer to complete as we have to retry in a different way as a fallback.
8. Try it with an image in an unsupported format (e.g. an AVIF file). You should see an error notice that lists the formats supported by OpenAI (JPEG, PNG, WEBP, and GIF).

### Scheduled resharing in the block editor

The major change to Social is bringing the scheduled re-sharing feature to the block editor. Along with this we have changed our social previews UI and moved the re-sharing button to our updated modal.

1. Connect Jetpack and enable Social sharing in Settings->Sharing
2. From the new Social Admin page, connect a social account.
3. Create a new post, optionally add a featured image.
4. Click to publish the post and in the pre-publish panel, click the Preview Social Posts Button
5. Check there are no action buttons and the preview displays. Optionally add a custom message to share with your post
6. Close the modal and publish the post
7. Wait for the success message, and view the sharing history. This will have a link to your post on Social Media
8. Close that modal, and the post publish sidebar. Click the Jetpack icon in the top right to open the Jetpack sidebar if it is not already
9. Click the preview and share button, which will open a similar preview modal to before.
10. Here you can optionally add a custom message again
11. Click the share button, and the modal should close. Eventually you'll see a success message in the sidebar as with publishing the post
12. Open the modal again and click the schedule button. Set a time a small amount in the future and click the confirm button
13. The post will be showed as scheduled, and will be shared to social media at the appropriate time.
14. Check the delete option works, by clicking on the icon
15. Buy a Jetpack Social plan for the site by clicking on the upgrade link (or on Atomic this will already be the case with the business plan)
16. Repeat the steps for re-sharing the published post, but this time you can add custom media, and the post will be saved before it is shared/scheduled.

### WordPress 6.8 Compatibility

Check the current version of WordPress on your test site at `/wp-admin/update-core.php`. If it’s not 6.8-beta3 or a 6.8 beta version, you may need to install the WordPress Beta Tester plugin (you won’t be able to do this on Atomic). Once installed and active, under Tools in WP Admin, select ‘Beta Testing’. Make sure to select ‘Bleeding Edge’ and then ‘Beta/RC’ only. Revisiting the WP Admin updates page mentioned above should show you an available update once you have saved those options.

Here we’re generally testing compatibility. Primarily most fixes made have been in related to console errors (which you would likely only see on your test site if [script debug is enabled](https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/)).

At the time of writing, not all console errors have been resolved, so if you see any related to `ButtonGroup` components being deprecated those can be ignored, as well as console warnings related to 36px default size for various components.

It’s possible you may see `useSelect` related warnings; some will be fixed soon. Though it might be hard to distinguish the origins of some of the console warnings, in short if you see any that refer to a ‘non equal value key’ of `pluginStatus`, or data, or `skippedConnections`, `enabledConnections`, `deletingConnections`, `updatingConnections`, and `notesConfig`, those should be fixed soon. Let us know if you see any others.

The main thing to test functionally is Jetpack blocks in the post / page editors:

* Related Posts
* Premium Content
* Blogging Prompt (when adding the block)
* Podcast Player (when adding an RSS feed)
* Slideshow (when adding the block)
* Map (checking the Mapbox Token’ section in the block sidebar)
* VideoPress (after adding a video, opening the ‘poster and preview’ section in the block sidebar)
* Forms (adding a block, though it’s worth testing different form child blocks, and the block sidebar in those cases generally)
* Using the Jetpack sidebar, as well as pre and post publish panels when publishing a post (or page). Make sure in those cases that panels generally display as you would expect.


**Thank you for all your help!**
