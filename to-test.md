## 7.6

### AMP

We've made multiple changes to Jetpack to improve compatiblity with the AMP plugin. We'd recommend installing both plugins on your site and run some tests. You'll want to enable the following Jetpack features:

- Sharing
- Image CDN
- Related Posts

Then, in your AMP settings, you can switch between different AMP modes. For each mode, the Jetpack features above should keep working well and appear on your site. 

- When using the Image CDN feature and looking at your site in an AMP view, you should see `amp-img` and `amp-anim` tags instead of the usual `img` tags, all relying on images hosted with our CDN.
- Related Posts should appear at the bottom of your posts, whether you are looking at your site via an AMP view or not. It's worth noting that in some AMP modes, you will not see any styles for the Related Posts just yet.
- When using the sharing buttons and looking at your site in an AMP view, you should see that some of the buttons will be displayed in a style developed by the AMP plugin (with square buttons), while other buttons will not be displayed at all because they are not supported by AMP.

### Sync

We've also made some changes and fixed some issues with the synchronization of your site's activity, posts, and taxonomies back to WordPress.com. To test this, we would encourage you to use many of the features that rely on sync, such as:

- Publicize & Subscriptions: try publishing or scheduling a new post and make sure it is sent to your followers. You will also want to make sure the information that is sent to your followers is correct; the categories listed at the bottom of the subscription emails should be correct for example.
- The WordPress.com Dashboad interface: try editing categories and other categories via the WordPress.com interface; you will want to make sure that what's displayed there is up to date and can be updated.

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticible and report anything you see.

**Thank you for all your help!**
