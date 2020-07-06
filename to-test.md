## 8.7

### Ads

Jetpack's Ads feature now includes a "Do Not Sell My Personal Information" setting, as specified in the California Consumer Privacy Act (CCPA) for California site visitors to opt-out of targeted advertising.

To test this, on a site with a Jetpack Premium or Professional plan, enable Ads under Jetpack > Settings > Traffic. On that same card, you'll have access to CCPA options.

- You can then place the Do Not Sell widget or shortcode (`[[ccpa-do-not-sell-link]]`) on the homepage (likely in the footer area).
- Verify the "Do Not Sell My Personal Information" link appears
- Click the link, and verify the Modal Notice appears
- Verify the usprivacy cookie is set to `1YNN`
- Opt-out from the Modal Notice
- Verify the usprivacy cookie is set to `1YYN`

### Autoloader

We've made some changes to the "Autoloader" tool we use to manage Jetpack libraries that are used in multiple plugins on the same site. This change should have no performance impact on sites using multiple plugins that rely on Jetpack libraries. The VaultPress plugin is a good example; you should be able to keep using both VaultPress and Jetpack with no issues. You can also test using a plugin like [this one](https://github.com/Automattic/client-example).

### Blocks

#### External Media

When inserting images in the block editor, you can now choose images from your Google Photos account, or from the Pexels Free Photos library. To test this, try using an image, gallery, tiled gallery, or slideshow block and see the new options appear next to the usual option to pick images from your media library.

The images you pick should get added to your Media Library for you, and you should be able to continue to use the blocks with no issues.

#### WhatsApp

This new block allows you to add a button to any of your posts or pages. Try adding the button, and make sure it works well.

### Gathering Twitter Threads

We've extended the Twitter Block and added an "Unroll" button that allows you to import full Twitter Threads and their embeds into a post. Give it a try by pasting a tweet that's part of a thread into your block editor. You should see the "unroll" option appear in the block toolbar. Click on it and let us know what you think of the results!

#### Mailchimp, Calendly, Payments, Eventbrite

We've made a number of changes to add more customization options to the buttons offered by the blocks above. To test this, try editing some of you existing blocks, and try creating new ones: you should now see more options to customize the block in the block sidebar, and any changes you make should appear in the block editor and on the frontend.

### Jetpack Search

We've added some new options to the customizer. Try the following on a site where Jetpack's Instant Search option is activated:

- Go to Appearance > Customize
- Ensure that your previous options haven't changed.
- Try playing with all the options there; they should all be saved properly, and be reflected on the frontend of your site.

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

**Thank you for all your help!**
