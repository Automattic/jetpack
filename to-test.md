## 8.6

### Blocks

#### Image Compare

This new block allows you to display and compare two images thanks to a slider. Give it a try by uploading 2 different images into the block (works best with images of the same size).

#### Latest Instagram Posts

This new block allows you to display an automatically updating list of the latest posts from your Instagram feed. Give it a try with your own Instagram account, and let us know what you think!

#### Form Block

We've also made some changes to the Form block. When you insert a new Form block, you can now choose to create one of our pre-built forms: RSVP, Registration, Appointment, or Feedback.

Give it a try by creating a new Form block and picking one of the options. You can also play with the different customization options for each field once you've done so. One of the new options you can play with is the width of each field; this allows you to have multiple fields next to each other within a form.

#### Subscriptions

We've made a lot of improvements to the Subscriptions block in this release. You now have several options to customize the look of the different elements of the form. To test this, we recommend: 

- Inserting a subscriptions form block on your site and try all of the new settings in the sidebar for customization.
- Saving the post and confirming the settings and design updates pass through to the front end of the site.
- Adding the subscription form widget to a widget area and confirming this still renders and works correctly.

### Carousel

We've added a new toggle under Jetpack > Settings > Writing in your dashboard. It allows you to hide the comments area in the image lightbox. Try toggling it off and ensure that the carousel no longer displays the Comment button, the text box to add a comment, and the comments list.

### Connection tools

We've started working on a number of interface changes to improve the onboarding experience for new Jetpack site owners. To test those changes, you'll want to add the following filters to your test site:

```php
add_filter( 'jetpack_pre_connection_prompt_helpers', '__return_true' );
add_filter( 'jetpack_show_setup_wizard', '__return_true' );
```

It will give you access to new tools:

- Even before you are connected to WordPress.com, you will see messages inviting you to connect under the Posts, Upload, and Widgets admin pages.
- Until you connect your site to WordPress.com, you will not be able to dismiss the Jetpack connection banner appearing at the top of the dashboard.
- Once you've connected your site to WordPress.com, you will be offered a new setup experience, available under Jetpack > Set Up or by clicking in the new banner appearing on the main dashboard screen.

Give those a try, and let us know what you think about them.

### Scan

You can now purchase [Jetpack Scan](https://jetpack.com/upgrade/scan/), a Jetpack service that will scan all files on your site and offer one-click fixes to keep your site one step ahead of security threats.

We would encourage you to give the service a try, and give us your feedback on all new interface elements used by the product:

- A new submenu item appearing under the Jetpack menu when you've purchased Jetpack Scan.
- A new admin bar item appearing when threats are detected on your site.
- An updated interface under Jetpack > Dashboard and Jetpack > Settings to display the status of Scan whether you've purchased Jetpack Scan or you use one of our Jetpack Plans offering the Scan feature.

### Sync

We're working on a new experimental feature aiming to minimize the impact of Sync on servers, by having Synchronization actions processed by WordPress.com asynchronously.

To enable and test this feature, add the following to a functionality plugin on your site:

```php
add_filter( 'jetpack_sync_non_blocking', '__return_true' );
```

You can then test features that rely on Sync, such as Publicize or email subscriptions.

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

**Thank you for all your help!**
