## 7.1

### Block Editor

This release introduces some new blocks we'd like you to test.

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

### Others

**At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**

**Thank you for all your help!**
