## 4.5

Jetpack 4.5 is packed with new things and improvements for your favorite modules! We also have some new features that we're very excited about. We're looking forward to getting your feedback on the following things:

### Carousel Lightbox for Single Images
When Carousel is active, a single image that is linked to the attachment image should open in a lightbox.
Make sure that regular Caoursel gallery lightboxes work as expected.
With Carousel disabled Attachment Page should be open instead of Lightbox
Image linking to Custom URL should open that URL
Image linking to Media File should open that Media File
Navigating directly to Lightbox view (URL with hash e.g. #jp-carousel-31) should go to the post with the Lightbox open
This behavior should be correct for:
- Post with single image only
- Post with gallery
- Post with multiple galleries and single images
- Multiple post view (e.g. home page)

### VideoPress Integration
**VideoPress, our Premium video offering, has been completely redesigned to be fully integrated into your Media Library.** It's now easier to upload videos and insert them into your posts and pages.
We've also improved our Open Graph Meta Tags to make sure VideoPress videos can be embedded in your Facebook Posts.

To test this feature, you'll need to use [Jetpack Premium or Jetpack Professional](https://jetpack.com/features/) on your site. If you've purchased one of the upgrades, you'll be able to activate the VideoPress module under Jetpack > Settings > Writing.

![VideoPress upgrade](https://cloud.githubusercontent.com/assets/5528445/20008893/b296c05c-a278-11e6-89af-f086aac100fe.png)

Once the module is active, you can try the following:

1. Head over to Media > Library or Media > Add New, and try to upload a new video to your site. It should be uploaded to VideoPress right away.
2. Try uploading a video from your post editor, under Add Media.
3. A few minutes after the upload, the video's meta data should be updated (as transcoding finishes), and you can view and edit that meta data from the edit media page in the Media Library.
4. You should be able to insert those videos into any post or page.

### Ads (formerly WordAds on wordpress.com)
To test this feature, you'll need to use [Jetpack Premium or Jetpack Professional](https://jetpack.com/features/)

Premium and Professional Jetpack plans will allow you to display ads on your site which can make you real money.
To test, upgrade to a Premium/Pro Jetpack plan and head over to your Jetpack settings Engagement tab and activate the Ads module.
By default, you will start seeing ads on the bottom of your posts.
You will also see a new Ads widget that you can dispaly in the sidebar of your theme.
There is an option in the settings card that will allow you to display ads in the header of your site as well.

### Contact Form Custom Values for Fields
You can now set custom fields for the fields of your form.  The value still defaults to the option name if none is set, as it did in prior versions.
Example useage:
[contact-form]
[contact-field label='dropdown' type='select' options='dropdown 1, dropdown 2' values='d1,d2'/]
[contact-field label='Radio' type='radio' options='Radio 1,Radio 2' values='r1,r2'/]
[contact-field label='Checkbox' type='checkbox-multiple' options='Checkbox 1,Checkbox 2' values='c1,c2'/]
[/contact-form]

Applying those values, you should see the values in the fields when you inspect them on the front end.

### New Widget: Follow Button
This is a new widget that came from wordpress.com to allow people to follow your site from a widget.
Add the widget, and have someone follow you!

### New Widget: Authors
This widget allows you to display your authors on the front end of your site.
Note: it does not come with much styling, so it is up to the theme/user to style as desired.

### New Widget: Blog Stats
This simple widget will display the page views on the front end of your site.
Add it and watch the count grow!

### New Widget: Milestone
With this widget you can display a countdown to an upcoming event or milestone that you set. Set the date/time/name of the event, and check it out in your sidebar.

### Lots of new shortcodes from wordpress.com
Check out all these new shortcodes available!  Follow the links for descriptions on how to use

[spotify](https://en.support.wordpress.com/audio/spotify/)
[tweet]
[googleapps](https://en.support.wordpress.com/google-docs/)
[brightcove]
[getty]()
[archiveorg](http://support.wordpress.com/videos/the-internet-archive/)
[hulu](https://en.support.wordpress.com/videos/hulu/)
[kickstarter](https://en.support.wordpress.com/videos/kickstarter/)
[gravatar](https://en.support.wordpress.com/gravatar-shortcode/)
[gravatar_profile]
[quiz](https://en.support.wordpress.com/quiz-shortcode/)
[sitemap](https://en.support.wordpress.com/sitemaps/shortcode/)
[lytro](https://en.support.wordpress.com/lytro/)
[mailchip_subscriber_popup]
[ustream](http://support.wordpress.com/videos/ustream-tv/)
[ustreamsocial]

### Related Posts in the Customizer
You can now preview your Related Posts in the Customizer before you save.  Just navigate to the customizer, or click the settings link in the Related Posts card in the Engagement tab to check it out.

During your tests, we'd encourage you to keep your browser console open, and check for any errors in the console and the network tabs.

**Thank you for all your help!**
