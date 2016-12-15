## 4.5

Jetpack 4.5 is packed with new things and improvements for your favorite modules! We also have some new features that we're very excited about. We're looking forward to getting your feedback on the following things:

### Carousel Lightbox for Single Images

When Carousel is active, a single image that is linked to the attachment image should open in a lightbox.
Make sure that regular Carousel gallery lightboxes work as expected.
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

### Ads (formerly WordAds on WordPress.com)

To test this feature, you'll need to use [Jetpack Premium or Jetpack Professional](https://jetpack.com/features/)

Premium and Professional Jetpack plans will allow you to display ads on your site which can make you real money.
To test, upgrade to a Premium/Pro Jetpack plan and head over to your Jetpack settings Engagement tab and activate the Ads module.
By default, you will start seeing ads on the bottom of your posts.
You will also see a new Ads widget that you can display in the sidebar of your theme.
There is an option in the settings card that will allow you to display ads in the header of your site as well.

### Shortcodes

We ported existing shortcodes from WordPress.com to Jetpack. Give them a try in a few test posts, and make sure they're rendered properly:

- [`[spotify]`](https://en.support.wordpress.com/audio/spotify/)
- `[tweet]` to insert specific tweets in your posts, like so: `[tweet tweet="https://twitter.com/jack/statuses/20" align="left" width="350" align="center" lang="es"]`
- [`[googleapps]`](https://en.support.wordpress.com/google-docs/)
- `[brightcove]` to embed [Brightcode videos](ttps://support.brightcove.com/en/video-cloud/docs).
- `[getty]` to insert images, like so: `[getty src="82278805" width="400" height="200"]`
- [Archive.org videos](http://support.wordpress.com/videos/the-internet-archive/) and books, thanks to the `[archiveorg-book]` shortcode: `[archiveorg-book goodytwoshoes00newyiala]`
- [`[hulu]`](https://en.support.wordpress.com/videos/hulu/)
- [`[kickstarter]`](https://en.support.wordpress.com/videos/kickstarter/)
- [`[gravatar]`](https://en.support.wordpress.com/gravatar-shortcode/)
- [`[quiz]`](https://en.support.wordpress.com/quiz-shortcode/)
- [`[sitemap]`](https://en.support.wordpress.com/sitemaps/shortcode/)
- [`[lytro]`](https://en.support.wordpress.com/lytro/)
- `[mailchimp_subscriber_popup]` allows you to create MailChimp Subscriber Popup Forms. The shortcode uses the following format: `[mailchimp_subscriber_popup baseUrl="mc.us11.list-manage.com" uuid="your_uuid" lid="your_lid"]`
- [`[ustream]`](http://support.wordpress.com/videos/ustream-tv/)

### Widgets

We've added quite a few new widgets, so make sure you try them all:

- **Authors**: display your authors on the front end of your site. *Note: it does not come with much styling, so it is up to the theme/user to style as desired.*
- **Blog Stats**: A simple stat counter that will display the page views on the front end of your site.
- **Milestone**: display a countdown to an upcoming event or milestone that you set.

### Related Posts in the Customizer
You can now preview the Related Posts settings in the Customizer before you save. In Jetpack admin screen, go to Settings > Engagement and activate Related Posts if it's not already active.

Expand its settings and click on the link: you should be taken to the Customizer, that should load your latest published post.

If you launch the Customizer from Appearance > Customize, the Related Posts panel should only show a message prompting you to go to a single post view. Once you're in a single post, the controls for Related Posts should be displayed.

This implementation leverages Customizer's Selective Refresh, so if you're using a theme like TwentySixteen that takes advantage of it, you should see only the Related Posts portion refreshing, not the entire page.

### Final Notes

During your tests, we encourage you to open your browser's Development Tools and keep the Console open, checking for any errors in the Console and the Network tabs.

To open the Console in Chrome or Firefox, you can press CMD+Alt+i in macOS or F12 in Windows.

**Thank you for all your help!**
