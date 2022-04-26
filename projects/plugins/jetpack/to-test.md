## Jetpack 10.9

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### VideoPress

In this release there are several additions related to VideoPress: the introduction of private videos and the resumable uploader, as well as increased chunk sizes to enable faster uploads.

**Video Privacy**

1. Add a Jetpack VideoPress plan (since you are likely going to need to upload more than one video).
2. The default site-level privacy setting will be public.
3. Create a new post, upload a video. Save and publish. Open post on a private tab. Video is visible.
4. Edit post. On the video block, set Privacy setting to Private. Save. Open post on private tab. You get a message that the video is private.
5. Go to Jetpack Settings > Performance and toggle site-wide private videos.
6. Create a new post and upload a video. Save. Opening the post on a private window, you get a message that the video is private.
7. Edit the post and set video privacy to public. Now the post video should play back on private windows.
8. Finally, create a new post, and create 2 new video blocks. Set one to public and one to private. In Jetpack Settings, enable site-wide private videos. Viewing the post on a private browser window, one of the videos will be playing back, the other will display a private message.

**Resumable Uploader**

1. With VideoPress enabled, create or edit a post and add a Video block.
2. Upload a video, you should see the resumable uploader progress bar.
3. Use the pause button to stop and restart the upload.
4. Once the video reaches 100% it should convert to the Video block.
5. Additionally, the chunk size has also increased for resumable uploads, so that can be tested by uploading a video larger than 10MB  (smaller works too, but its easier to catch the upload requests).
6. Check the Network Inspector - the upload should happen in 10Mb chunks instead of 500KB.

### Module activation / deactivation

Module activation and deactivation methods have changed location to live within the Status package. You can test activation and deactivation of various features within the Jetpack settings pages and via the module page at `/wp-admin/admin.php?page=jetpack_modules` (and anywhere else that you can).

### In-place connection removal

In-place connection flows have been removed. As such we want to make sure all the connection flows work. 

1. Test the full-screen connection prompt - this should only display immediately after activating the plugin on the plugins page.
2. Test the connection banner at the top of the main wp-admin dashboard.
3. Test the following connection option: `/wp-admin/admin.php?page=jetpack#/setup`.
4. When already connected, test the reconnect flow here: `/wp-admin/admin.php?page=jetpack#/reconnect`.
5. When already connected (site only), test the connect user flow here: `/wp-admin/admin.php?page=jetpack#/connect-user`.

### Jetpack Assistant

This release introduces multiple new recommendations cards to help with Jetpack setup (self-hosted Jetpack sites only), and these can be tested from the Recommendations tab at `/wp-admin/admin.php?page=jetpack#/recommendations`. For each, test with a free plan. You can then add the recommended plan and check the recommendations flow again, which should be updated to reflect your current plan. Some flows to test include the following:

**Testing extra navigation controls to the recommendations flow**

1. Navigate to `/wp-admin/admin.php?page=jetpack#/recommendations/site-type`.
2. Proceed through the recommendations flow, note that when viewing individual feature recommendations, each step provides a CTA to activate the feature or to skip it.
3. When you reach the summary screen, you should now be able to click on the names of each feature/ resource to view that step in the flow again.
4. After you have reached the summary screen and go back to view an individual step, you should have a new control below the CTA button to "View Summary". Clicking "View Summary" should return you to the summary screen.
5. If you did not activate any of the features in the flow, activate "Downtime Monitor" from the summary screen.
6. After Downtime Monitor is activated, click on the feature name in the summary screen to view the individual recommendation step.
7. Notice that, since the feature is active, an "Enabled" label shows on the step and the CTA link now links to the settings for the feature. Additionally, the skip link below the CTA button now reads "Next" instead of "Not Now".
8. Test activating a few other features and confirm that the CTA buttons on the individual recommendations are linking to the proper settings controls for each feature.

**Testing the Publicize recommendation**

1. Create a new post. After the post is published, navigate back to the Jetpack Dashboard. You should see a red badge with a "1" next to the Recommendations tab in the navigation on the Jetpack dashboard - indicating a new recommendation is available.
2. Click on the "Recommendations" tab in the navigation - you should now see a recommendation to enable the Publicize feature. There should be a green "New" badge that shows on this step next to the progress bar.

**Testing the Security recommendation**

1. Go to the plugins page and enable the "Hello Dolly" plugin. You can disable it again right away if you like.
2. After the enabling the plugin, navigate back to the Jetpack Dashboard. You should see a red badge with a "1" next to the Recommendations tab in the navigation on the Jetpack dashboard - indicating a new recommendation is available.
3. Click on the 'Recommendations' tab in the navigation - you should now see a recommendation step that provides some information about plugin security. There should be a green "New" badge that shows on this step in the upper-left corner. The CTA button should link out to this article: jetpack.com/2021/10/15/wordpress-security-for-beginners-2.

**Testing the Anti-spam recommendation**

1. Add at least 5 sample comments to a post on your site.
2. Navigate back to the Jetpack dashboard. You should see a red badge with a "1" next to the Recommendations tab in the navigation on the Jetpack dashboard - indicating a new recommendation is available.

### Payments Block

In this release there are a few enhancements to the Payments Blocks (Premium Content on WoA and Payment Button). You will need a Jetpack Security plan or higher to connect the Payment Button block. Some specific changes include: the 'add donation' and 'allow custom amount' options have been added; both blocks should show a Stripe connection nudge if Stripe isn't connected; 

1. To test, go to `wp-admin/post-new.php` and add a new Payments Block.
2. Add a new payment plan.
3. Make sure that "Mark as a donation" and "Enable customers to pick their own amount" toggles are working properly in the settings sidebar.
5. An additional new feature to test is that both blocks should have a Stripe connection nudge, which should disappear once Stripe is connected.

### Publicize

The Publicize package is now being used from a different location - the packages folder in Jetpack instead of the plugin's module files. With this change, it would be helpful to test that Publicize (and also re-publicizing with a Jetpack Security plan or higher) works as you would expect. Some examples of what you can test include adding and removing new Publicize connections, sharing posts, disabling Publicize on individual posts, and re-publicizing older posts.

While testing Publicize, you can also test bulk publishing posts - a fix was added in this release which prevents bulk-edited posts being publicized. You can test this with just one post: if you select "edit" underneath "bulk actions" in the posts list and change the status of a draft to be published (it shouldn't share in this case).

**Thank you for all your help!**
