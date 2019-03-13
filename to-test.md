## 7.1

### Block Editor

This release introduces some new blocks we'd like you to test.

#### Ads

the Ads block allows you to insert different ads from [our WordAds program](https://jetpack.com/support/ads/) within your posts and pages. To use it, you need to purchase a Premium or a Professional plan. Once you have one, you can turn on the Ads feature under Jetpack > Settings > Traffic in your dashboard. Once you've done so, try the following:

- Add the block using the block picker using only a cursor (don’t search for it). Was it where you expected? Does the icon fit?
- Add the block by searching for it. Don’t just search for the name of it. Try other search terms you might use to find the block. Are we missing any?
- Make sure the ads are displayed properly on your site.

#### Business Hours

The Business Hours blocks is useful for companies who want to display their business's Opening Hours on their site. To test it, try the following:

- Add the block using the block picker using only a cursor (don’t search for it). Was it where you expected? Does the icon fit?
- Add the block by searching for it. Don’t just search for the name of it. Try other search terms you might use to find the block. Are we missing any?
- Add Opening Hours for some days, and not for others. Ensure that the block looks good in the editor and on the site's frontend.
- Set the business to be closed on some days and open on hours. Does everything work?
- Make sure the block works regardless of your site's language.

#### Contact Info

The Contact Info block is a great block to go along the Business Hours block. You can use it to list your business' address, phone number, and email address, in a format recognizable by Google and other search engines. To test it, try the following:

- Add the block using the block picker using only a cursor (don’t search for it). Was it where you expected? Does the icon fit?
- Add the block by searching for it. Don’t just search for the name of it. Try other search terms you might use to find the block. Are we missing any?
- Add some information, use all the child blocks or only some of them. You can also reorder them around.
- Make sure every information and every link works well in the editor and on your site.
- Once you're happy with the result, make sure the page does not throw any warnings in [this Google Structured data tool](https://search.google.com/structured-data/testing-tool).

#### Mailchimp

The Mailchimp block allows you to insert Mailchimp subscription forms anywhere in your posts and pages. To test this, you will need [a Mailchimp account](https://mailchimp.com/), and an email list in that account. The block will be used by your readers to add themselves to that list, that you can later use to contact your subscribers.

Once you have that, try the following:

- Add the block using the block picker using only a cursor (don’t search for it). Was it where you expected? Does the icon fit?
- Add the block by searching for it. Don’t just search for the name of it. Try other search terms you might use to find the block. Are we missing any?
- Try modifying button text and description.
- Try subscribing to a mailing list – can you see the email at your list over at Mailchimp.com?
- Try inserting multiple instances of the block.
- Try testing on a variety of screen sizes, and devices if possible, both in the editor and theme -side.
- Try changing a theme (feel free to test a few different ones)
- Try adding block as a contributor level user
- Test how the block looks like from RSS feed or in Jetpack subscription emails
- Test on mobile
- Test how the block works as a “reusable block”.

#### Related Posts

The Related Posts block isn't new, but we've made some changes to how it works and would appreciate your eyes on this. Try adding the block to one of your site, and try playing with the number of posts listed in the block. You can now add up to 6 related posts! Make sure that works well.

#### Slideshows

Slideshows are often a nice alternative to galleries, and have long been part of Jetpack, alongside Tiled Galleries. We're now bringing that option to the block editor, with a brand new block! You can test it like so:

- Add the block using the block picker using only a cursor (don’t search for it). Was it where you expected? Does the icon fit?
- Add the block by searching for it. Don’t just search for the name of it. Try other search terms you might use to find the block. Are we missing any?
- Try adding images of different aspect ratios.
- Try different options, both from the block toolbar, and the sidebar. Verify that each change works like it should. After modifying options, update the post and verify that the saved content on the frontend works and looks like expected.
	- Change the transition effect
	- Change the number of images
	- Change captions (add links)
- Add new images by uploading using the upload-button, dragging over the gallery and from the Media library using the pen-icon from the toolbar. Try removing images, too.
- Try converting the block to a regular gallery and images.
- Try inserting multiple instances of the block and resize the editor either by resizing the browser window, toggling Gutenberg sidebar on/off or changing the orientation of a mobile device.

#### VideoPress

We aim to port our existing [VideoPress](https://jetpack.com/features/design/video-hosting/) functionality into the video block. We're still working hard on this, but we've made some changes to the existing **Video Block** in WordPress to start supporting VideoPress videos. To test this, try the following:

- On a site using a free Jetpack plan, go to Media > Library and upload a few small videos.
- Purchase a Premium or a Professional plan.
- Go to Jetpack > Settings and toggle the "Enable high-speed, ad-free video player" option.
- Go to Media > Library and try uploading more videos. You should notice that they will be uploaded to VideoPress at this point.
- Go to Posts > Add New and try to insert Video Blocks. In the media picker, try picking the videos you uploaded before you purchased a plan, and then try with a VideoPress video.
- Try editing the blocks. Are you able to upload or select a different video?
- Try opening an existing post that contains old video blocks. Are they migrated to the new VideoPress-enhanced video blocks?
- Downgrade to a free plan or, in Jetpack, disable the VideoPress module. What happens when you insert video blocks? What happens to the existing posts containing VideoPress-enhanced video blocks?

### Plugin Search Hints

Jetpack offers many useful features, so many that it is sometimes hard to remember all of them. From now on, we'll remind you of features that may be useful to you when you search for new plugins under Plugins > Add New in your dashboard. When you look for plugins there, if we think that an existing Jetpack feature may be a good fit for what you are looking for, we'll suggest that you discover, enable, or configure that feature on your site.

To test this, head over to Plugins > Add New and search for plugins similar to some of the things Jetpack offers. You should see a "Jetpack: feature" card appear among the search results. Try to interact with that card (dismiss it, activate the feature, configure it), and see that everything works as expected.


### Others

**At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**

**Thank you for all your help!**
