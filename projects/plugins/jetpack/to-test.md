## Jetpack 14.6

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`
	- To test Breve further in the document please enable the feature with the following snippet: `add_filter( 'breve_enabled', '__return_true' );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**

### Onboarding

PR: https://github.com/Automattic/jetpack/pull/43203

There have been lots of changes to the onboarding page, and we want to make sure there aren't any issues before we roll this out.

1. Ensure your site is not connected to Jetpack.
2. Go to My Jetpack.
3. Click on "Supercharge my site".

Verify things connect without any errors or friction.

### Blogroll block

1. Add a new post or page and insert a Blogroll block.
2. Once the block has loaded with a few blogroll items, click on the icon to add a new blogroll item.
3. Save and refresh the post / page where you previously added a Blogroll block.
4. Click the icon to add a new blogroll item.
5. Make sure everything works as expected. You see no block-related Blogroll console warnings nor errors in log if you have access to those.

### Update legacy Twitter icon to X icon

1. Start by enabling the Twenty Ten theme.
2. Enable Jetpack offline mode: https://jetpack.com/support/offline-mode/
3. Go to Jetpack > Settings > Sharing and enable the legacy sharing buttons.
4. Go to Settings > Sharing. Ensure the Twitter button uses the X icon.
5. Add a Twitter sharing button and save your changes.
6. Check the site's frontend. Ensure the Twitter button uses the X icon.
7. Go to Plugins > Add New.
8. Install and activate the Classic Widgets plugin.
9. Go to Jetpack > Settings Writing, and enable Extra sidebar widgets.
10. Go to Appearance > Widgets.
11. Drag and add a Social Icons widget to your sidebar.
12. Add a few social networks to the widget's settings: https://twitter.com/jetpack/ and https://www.facebook.com/jetpackme.
13. Save your changes.
14. Check the frontend. The icons should be displayed properly.
15. Go to Appearance > Theme File Editor.
16. Edit your theme's functions.php file, and add the following snippet:
```
// Add social menu support
add_action( 'after_setup_theme', function () {
    add_theme_support( 'jetpack-social-menu', 'svg' );
} );
```

17. Edit your theme's footer.php file, and add the following right before the closing wrapper div:
```
<?php jetpack_social_menu(); ?>
```

18. Go to Appearance > Menus.
19.Create a new menu, assign it to the "Social Menu" menu location.
20. Add the same custom links as for the Social Icons widget above, and save your changes.
21. View the site's frontend. You should see the right icon in the footer for the Twitter link.
22. Now enable Jetpack blocks under Jetpack > Settings > Writing.
23. Also disable legacy sharing buttons in Jetpack > Settings > Sharing.
24. Go to Appearance > Themes.
25. Activate the Twenty Twenty Four theme.
26. Go to Appearance > Editor > Templates > Single Posts.
27. Add a Sharing buttons block below the post content.
28. Add a Twitter sharing button in there. Ensure it is displayed properly.

### Stylelint

We've been progressively fixing and enabling various Stylelint rules. Doing a click-through and checking for any visual regressions would be appreciated!
