## 10.3

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Likes

We've made some changes to some of the Likes' settings. To test this out, try the following:

- Test different setups (Likes & Sharing enabled, only Likes enabled, etc.) in Jetpack > Settings > Sharing.
- For each setup, test different settings for the Likes under Settings > Sharing: enabled for all posts, enabled per post.
- For each setup, publish some posts and change the different toggles in the Jetpack plugin sidebar in the block editor.
- Make sure the Likes and sharing buttons are appropriately displayed on the front end.

### Publicize

We've made a lot of changes to the Publicize interface in this release, to prepare for the addition of the RePublicize feature in the block editor.

Try activating the Publicize feature under Jetpack > Settings > Sharing, then go to Posts > Add New. You should be able to connect new social networks to your site from there, and Publicize should be triggered when you publish new posts. The interface should remain as you know it.

### VideoPress

We're continuously improving the experience with VideoPress. In this Beta release, you can try the following:

1. On your site, go to Jetpack > Dashboard or Jetpack > Site Stats, and search for the "VideoPress" card. Follow the steps from there, and take note of anything in the flow that seems out of place or not working.
2. Once you've purchased a Jetpack VideoPress plan, go back to Jetpack > Settings > Performance in wp-admin, and ensure that the VideoPress card is nicely displayed, with no more prompts to upgrade.
3. Go to Posts > Add New and try to upload a video.
4. Play with the different block settings.

Let us know what you think!

### Widget Deprecations

We've made changes to multiple widgets in this release, to allow folks using those widgets to switch to using blocks instead.

To test this, try the following:

1. Go to Jetpack > Settings, and enable the Extra widgets as well as the subscriptions feature.
2. Install [the Classic Widgets plugin](https://wordpress.org/plugins/classic-widgets/).
3. Go to Appearance > Widgets.
4. Set up the following widgets: Contact Info & Map widget, Subscriptions, Social Icons.
5. Deactivate the Classic Widgets plugin.
6. Go back to Appearance > Widgets and attempt to transform the legacy widgets you set up earlier. You should be offered the option to transform them into blocks.

**Thank you for all your help!**
