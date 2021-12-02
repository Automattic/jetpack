## 10.4

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### New connection process for folks using a coupon code

Before you can test that change, you will need to add the following to your site, for example via a plugin like [Code Snippets](https://jetpack.com/support/adding-code-snippets/):

```php
add_filter( 'jetpack_partner_coupon_supported_partners', function ( $partners ) {
	$partners['JPTST'] = 'Jetpack Test';

	return $partners;
} );

add_filter( 'jetpack_partner_coupon_supported_presets', function ( $presets ) {
	$presets['JPTA'] = 'jetpack_backup_daily';

	return $presets;
} );
```

There are 2 different scenarios you can test:

**Pre-connection screen**

1. `Go to /wp-admin/admin.php?jetpack-partner-coupon=JPTST_JPTA_123AB`.
2. You should now be redirected to a screen that says "Welcome to Jetpack Jetpack Test traveler!"
3. Click the "Set up & redeem Jetpack Backup" button.
4. Approve that Jetpack is allowed to use site data.
5. You should now be directed to checkout with a 100% discounted Jetpack Backup Daily product.

**Connected Jetpack**

1. Connect your site to your WordPress.com account.
2. Go to `/wp-admin/admin.php?jetpack-partner-coupon=JPTST_JPTA_123AB`.
3. You should now be redirected to a screen that says "Welcome to Jetpack Jetpack Test traveler!"
4. Click the "Redeem Jetpack Backup" button (this should not say "Set up" in the button since we're already connected).
5. You should now be directed to checkout with a 100% discounted Jetpack Backup Daily product.

### New option to add a license key to your Jetpack installation

You can now purchase a license key for a paid Jetpack product, even if you do not have a site yet. Once you have a site, you will be able to attach the license key to your new site. To test this, try the following:

1. Go to [https://cloud.jetpack.com/pricing](https://cloud.jetpack.com/pricing) and purchase a plan for a standalone product.
2. After purchasing the product, you will land on a screen that asks you where you'd like to use that product. **Do not pick a site there just yet**.
3. Go to your site's dashboard, and connect to WordPress.com.
4. After connecting your site, return to your wp-admin dashboard, and head over to the Jetpack dashboard; you should see a notice inviting you to enter a license key.
5. You can try following that prompt, or you can go to Jetpack > Dashboard > My Plan and check the prompt in the card there.
	- You can get your license key by checking [this screen](https://wordpress.com/me/purchases/).
6. You can also try dismissing the prompt.

Let us know if that flow seems to be working for you.

### Welcome screen for WooCommerce store owners

We've added a new screen that's shown when the Jetpack Dashboard of a site is shown for the first time. This screen appears for both connected and disconnected sites, and also appears when somebody activates Jetpack directly from Woo, or the plugins page. To test:

1. On a brand new site, Install and activate WooCommerce.
2. With WooCommerce active, click on Jetpack on the admin menu to go to the Jetpack Dashboard.
3. Make sure you are redirected to `/wp-admin/admin.php?page=jetpack#/woo-setup`, and can follow the link from there to access the dashboard.

There are a few other scenarios where you can get to that screen, as long as WooCommerce is installed and active:

- If you already have Jetpack and the site is connected to WordPress.com, but have never seen that screen before.
- If you have just installed Jetpack, connected through any screen, but visited the Dashboard for the first time.

### Disconnection flow improvements

We've extended the disconnect dialog component so that it can show more information before disconnecting and then provide a feedback survey following disconnection. Try the following:

1. On a new site, install and activate both Jetpack (running the Release Candidate version) and Jetpack Backup.
2. Connect your site to WordPress.com.
3. Go to Jetpack > Dashboard, scroll down and click on the link to start the disconnection process.
4. Follow the steps there, and let us know what you think of the flow.
5. After reconnecting your site to WordPress.com, you can follow the same process to disconnect from WordPress.com, starting in the Plugins screen in wp-admin.

### Instant Search

We're continously improving the Instant Search feature, and fixed some more bugs in this release. You can try the following:

1. Start by adding a Jetpack Search plan on your site.
2. Go to Jetpack > Search, and ensure everything looks good there.
3. On that page, click on the link to customize search results, and ensure the different settings work, and get reflected on the front end when you save your changes.
4. Try playing with the different filters on the front end of your site, and ensure everything still works.

### Publicize

In this release, we've made some changes to the Publicize panel that is displayed on the right hand side of the block editor. The panel could previously only be used before you hit the Publish button. Now, you can **re-share** posts that have already been published, if you use a paid plan on your site. To test this, try the following steps:

1. Start with a free Jetpack site.
2. Go to Settings -> Sharing, and turn on "Automatically share your posts to social networks" in the "Publicize connections" section.
3. Go to Posts > Add New, and create a post.
4. In the Jetpack sidebar, you'll see options to connect a Social Media account. Follow the steps to do so.
5. When publishing the post, that post should be shared to your linked account.
6. Navigate back to the posts list and edit that post.
7. Once in the block editor, open the Jetpack sidebar.
	- ⚠️ Make sure there is a "Share this post" section, containing a prompt to upgrade to a paid plan.
8. Upgrade your site to a paid plan (Security or higher).
9. Edit the post again, and open the Jetpack sidebar.
	- ⚠️ Make sure there is a "Share this post" section, containing the connected social network account, a textarea, and a "Share Post" button.
10. Share the post.
	- ⚠️ Make sure the post is shared successfully.
	- A confirmation popup should show up in the bottom left corner of the editor.
11. Check in the connected social network if the post has been shared.

### Likes And Comment Likes

We continue to make changes to improve the performance of the Likes and Comments Likes features, and once again we'd like to ask you to test different aspects of the feature:

- Test different setups (Likes & Sharing enabled, only Likes enabled, etc.) in Jetpack > Settings > Sharing.
- Test Comment Likes too, in Jetpack > Settings > Discussion.
- For each setup, test different settings for the Likes under Settings > Sharing: enabled for all posts, enabled per post.
- For each setup, publish some posts and change the different toggles in the Jetpack plugin sidebar in the block editor.
- Make sure the Likes and sharing buttons are appropriately displayed on the front end, whether you are logged in, logged out, looking at a single post or a posts list screen (homepage).

### VideoPress now supports video tracks!

You can now upload `.vtt` files to add captions/subtitles to a VideoPress video. To test it out, try the following:

0. Start with a site where you've activated the VideoPress feature under Jetpack > Settings > Performance.
1. Add a new video (or choose an old one) to the block editor, click on the captions button, and upload a new track. Only .vtt files should be allowed to be selected and uploaded. You can find an example of a .vtt file [here](https://cloudup.com/c6gxBRCCtEv).
2. You can add a type, source language and label. Leaving them blank should default to English, en, and subtitles.
3. The track should upload and you should return to the main list.
4. Publish the post and watch the video. Your track(s) should be selectable in the player.
5. Try deleting tracks, they should be removed from the list and no longer show as an option if you refresh the player.
6. When uploading a track, try violating one of the form field requirements, for example the Source language field can't be larger than 5 characters. You should see an error message at the bottom of the component.
7. Add the same video to another block, it should fetch the track data form the api and you should see them in the tracks list.
8. Take note of the url for a video track (Look for tags when you view source) If you delete a video from the media library, the tracks files should also be deleted and 404.

**Thank you for all your help!**
