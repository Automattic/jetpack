## 9.5

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Blocks

We've updated several blocks to ensure full compatibility with the upcoming version of WordPress, 5.7. To test those changes, you'll want to try inserting different blocks on your site, whether it runs WordPress 5.6 or WordPress 5.7 Beta. You'll want to take extra attention to the toolbar buttons that appear above each block in the editor. Those toolbars should keep working just like before. Here is a full list of the blocks that were updated:

- Business Hours
- Calendly
- Contact Form
- Donations
- Eventbrite
- Gathering Tweetstorms ("unroll" feature appearing in the toolbar when embedding a Twitter thread)
- Map
- Pay With Paypal
- Payments
- Pinterest
- Podcast Player
- Premium Content
- Publicize
- WhatsApp
- Slideshow
- Tiled Gallery
- Video


### Dashboard

This release introduces a new banner, appearing in the main dashboard and on the Plugins page once you've connected Jetpack to WordPress.com. To test, try the following:

* On a new site visit wp-admin. Verify that the dashboard banner displays.
* Do one of the following:
    * Select some options and click continue. If you chose store, verify that you are taken to the WooCommerce prompt. If not, verify that you are taken to the Monitor prompt. Return to the wp-admin dashboard and verify that the dashboard banner does not display.
    * Dismiss the banner and reload the page, verifying that it does not display.

### Tiled Galleries

Tiled Galleries now work without the need of jQuery. To test that the galleries still work, try the following:

1. Follow [instructions to set up tiled galleries](https://jetpack.com/support/tiled-galleries/).
2. Create 2 new posts:
    - One using a classic block, and a tiled gallery in that block
    - One using a Tiled Gallery block
3. Ensure that in both scenarios, tiled galleries still work, regardless of the gallery type (square, circle, colunmns...) you choose.

### Related Posts

We've also worked on improving the performance of Related Posts. To test that they still work, try the following:

1. Enable Related posts under Jetpack > Settings
2. Ensure that related posts appear at the bottom of your posts, when you have a sufficient amount of posts and when those posts have been synced with WordPress.com.
3. Ensure that Related Posts blocks added to any post are displayed properly.

**Thank you for all your help!**
