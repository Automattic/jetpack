## 9.0

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Blocks

We've made changes and fixed bugs for multiple blocks in this release. Give them a try, and see that they still work for you:

- EventBrite
- OpenTable
- Pay With PayPal
- Slideshow
- Google Calendar
- Image Compare
- Pinterest
- Donations

You can give those blocks a try with the AMP plugin active, to ensure that those blocks are accessible in AMP views as well.

### Embeds

Facebook and Instagram are planning on making a number of changes to the way their embeds work. As a result, their embds will stop working on most sites in the near future. On our end, we've made changes to Jetpack's Shortcodes feature to ensure that embeds keep working for everyone using the feature.

To test this, you can try to embed any of the following things, either in the block editor or the classic editor, with or without the Gutenberg plugin active:

```
https://www.instagram.com/tv/BkQjCfsBIzi/
[instagram url=https://www.instagram.com/p/BnMOk_FFsxg/]
[instagram url=https://www.instagram.com/p/BZoonmAHvHf/ width=320]
https://www.facebook.com/VenusWilliams/posts/10151647007373076
https://www.facebook.com/video.php?v=2836814009877992
https://www.facebook.com/watch/?v=2836814009877992
https://www.facebook.com/WhiteHouse/videos/10153398464269238/
```

### Publicize

This release introduces a new Publicize feature: you can now publish the entire content of posts to Twitter as a thread. To test this, try the following:

1. Go to Jetpack > Settings > Sharing, and enable Publicize
2. Connect your site to a Twitter account
3. Go to Posts > Add New (using the block editor).
4. Write a post, with different types of blocks. You can try as many different blocks as you can.
5. In the Jetpack sidebar, access Publicize options and you should see the option to publish to Twitter as one tweet, or a thread.
6. If you choose the thread option, you'll have more information in the block editor itself, showing you where paragraphs will get split in multiple tweets, and showing you what blocks will not be ported to Twitter.
7. Publish your post, and see what happens on your Twitter account!

Let us know what you think about the process, and let us know if you find any bugs.

### Site Health

We've made a number of improvements to the Jetpack tests available under Tools > Site Health. Give them a try, and let us know if you find any test results that seem out of place.

As part of those changes, we've also made it easier and faster to reconnect your site to WordPress.com if there are any connection issues found during a site health test. If your site is not properly connected to WordPress.com, you should see a link to reconnect in the site heatlh test. Give that a try, and let us know how it goes!

**Thank you for all your help!**
