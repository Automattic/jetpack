## Jetpack 12.4

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

## Items behind the feature flag

Some development is still underway on these features, so it's important to test that in their default state they aren't accessible to the user, and do not add any regressions.

### The subscriber modal

We've now put this behind a feature flag using the jetpack_subscriptions_modal_enabled filter. When feature flag is set to false it should prevent the modal or modal related features or settings from loading.

Optionally to test the modal you will need a connected Jetpack site and some setup:

- Setup: Lettre theme. Activate the Lettre theme on your site.
- Setup: Add Filter. For the feature to show, you will need to use add_filter with the 'jetpack_subscriptions_modal_enabled' to return true. Use this snippet:

```
add_filter( 'jetpack_subscriptions_modal_enabled', '__return_true' )
```

- Test: Login to your site and go to Jetpack settings > Discussion. Enable Subscriptions and enable the Subscribe modal. Confirm that this toggle works, and that the update value persists (ie, try refreshing the page).
- Test: Go to front end of your website, and scroll. Shortly after you stop scrolling, you should see the subscribe modal popup.
- Test: Confirm that once you close the modal, it no longer loads (note: it will load again if you reload the page).
- Test: Enter an email and confirm you are subscribed, and the the behavior of the success notice is sane.

## Items that need testing on older themes

Some things have changed that also need attention on older themes. Switch to a theme like Twenty Ten to do the following:

### Social Menu Threads support

- /wp-content/plugins/jetpack-dev/\_inc/social-logos/social-logos.html
- Check the new Threads logo
- Go to Jetpack > Settings and enable extra sidebar widgets.
- Switch to an old theme, like Twenty Ten.
- Go to Plugins > Add New and install the Classic Widgets plugin.
- In a functionality plugin that allows adding code snippets, add the following:

```
// Add social menu support
add_action( 'after_setup_theme', function () {
	add_theme_support( 'jetpack-social-menu', 'svg' );
} );
```

- Edit your theme and add the following, in footer.php for example

```
<?php jetpack_social_menu(); ?>
```

- Go to Appearance > Customize > Menus
- Create a new menu with some links, e.g. https://www.facebook.com/jetpackme and https://www.threads.net/@tconrad
- Assign that menu to the Social Menu location
- Go to Appearance > Widgets menu
- Drag the Social Icons widget to one of the active widget areas, and add some links again.
- Check how things look like on the frontend, for both your social menu and the Social Icons Widget you created.

### Related posts - different link based on a theme

- Start on a site connected to WordPress.com.
- Go to Jetpack > Settings > Traffic
- Enable the Related Posts feature.
- Check that the configuration link at the bottom of the card works, and that the wording is accurate. Since your test site is on an older theme, you should get a link to the customizer.
- When you switch back to a block theme, you should get a different link and different text.

## Sharing

Jetpack had trouble with Sharing buttons being correctly displayed in this release cycle. To make sure things are smooth, please do the following:

- Go to Jetpack > Settings > Sharing.
- Enable sharing buttons.
- Go to Settings > Sharing, and enable a few buttons.
- Check that they look good on the frontend.

We have deprecated sharing to Skype in this release, to test that deprecation process:

- Start with a site running previous stable Jetpack version, or roll back to it.
- Go to Jetpack > Settings > Social and enable sharing buttons.
- Go to Settings > Sharing and add a Skype sharing button to your site.
- Check your site's frontend; the button should appear.
- Update back to this beta version.
- Check your site's frontend again.
  - the button will appear with a message when you're logged in.
  - the button will not appear when you're logged out.

## Jetpack Dashboard

### Introducing Jetpack Newsletter

The recommendations flow now includes Jetpack Newsletters when you connect a new site.

- Step through the "Recommendations" using Jetpack Free (i.e. not a paid plan)
- You should see the Newsletter recommendation.
- Enable it, it should show up on the summary.
- Navigate directly to the card wp-admin/admin.php?page=jetpack#/recommendations/newsletter it should show the status of the feature.

### My Plan

- Purchase Stats for your site https://wordpress.com/checkout/${siteId}/jetpack_stats_monthly
- Open /wp-admin/admin.php?page=jetpack#/my-plan
- Ensure you see Stats / Stats Free listed in My Products

### Earn

There's a new Earn section added to the Jetpack Settings dashboard. It should contain the Ads section previously located in Settings > Traffic. Depending on whether a user is connected or not it should offer to connect before showing payments related information. Try loading this page with a disconnected site, connecting, and reviewing its contents. Make sure all links work, and there are no visual problems.

### Subscribers

We currently link to an old Calypso page when folks want to see their subscribers after enabling the Subscriptions. But in the past few months, there were two new screens added that can be better than the existing one:

- Your site will need to be connected to WordPress.com, and the Subscriptions module must be enabled.
- Go to Jetpack > Settings > Discussion
- Ensure the link to view subscribers works. It should be updated depending on your site settings
  - Is the Stats module enabled (you can disable it under Jetpack > Settings > Module)
  - Is the new Stats experience enabled (you can check that under Jetpack > Settings > Traffic)

### Custom CSS

There's a new feature introduced into Jetpack to detect if the WordPress site has the core site editor feature enabled. With it comes a contextual adjustment to the user interface. The Jetpack > Settings > Writing > Custom CSS toggle is now conditionally rendered based on whether the site uses a block-based theme or not. For sites using a block-based theme, this toggle is removed, aligning with the concept that such themes inherently offer greater flexibility for customization and thus the additional CSS settings might not be necessary. To test it:

- Start with a site connected to WordPress.com with a classic theme like Twenty Twenty One.
- Go to Jetpack > Settings > Writing
  - You should be able to turn the Custom CSS feature on and off.
  - Leave the feature on.
- Now go to Appearance > Themes and switch to the Twenty Twenty Three theme.
- Go back to Jetpack > Settings > Writing.
  - You should still have the option to turn the feature off, but a notice now recommends Global styles instead of the Customizer.
- Turn the feature off
  - The toggle should disappear. A notice should remain, explaining that Global Styles are the way to go now.

## Pexels integration

There is a new service added to our editor suite to allow adding images from the Pexels service. To test:

- Go to a Jetpack-connected site.
- Edit or create a new Post.
- Open the Media Sidebar
- You should see the Pexels integration.

## AI extensions

This release cycle has seen many improvements to the AI extensions family shipped with Jetpack. Rather than testing the improvement and fixes individually, we have tried to collate everything into a single routine that you can follow. Feel free to deviate and try other things too.

- Go to the block editor
- Create some context using a Paragraph block
- Change its content by using the AI Extension dropdown
- Confirm the core block transforms to an AI Assistant block
- Confirm it automatically requests the suggestion
- Confirm it continues working as usual
- Confirm it doesn't perform the automatic request when the block is transformed using the Ask AI Assistant of the Transform block tool.

- Add paragraphs in your post.
- Select multiple (2, 3, 4 ...).
- Convert them using Ask Ai Assistant button.
- They should be all converted and current blocks removed.
- Create a heading block
- Click on the Ask AI Assistant extension option
- Confirm it properly preserves the heading level, instead of always getting Heading level 2.

- Add a list and some paragraphs.
- Check that you can use the AI Assistant toolbar menu on lists.
- Check that, when transforming multiple paragraphs, their content is not concatenated into one paragraph, remaining separate.
- Use the new AI Extension to transform the paragraph an AI Assistant block through the Ask AI Assistant button.
- Iterate and click in Try Again.
- It should reset the content to original paragraph.

- Create a paragraph block with formatted texts (bold, italic, ...).
- Transform to an AI Assistant block instance.
- Request a change by using the AI Extension options.
- Make sure the generated content has Markdown syntax instead of HTML.

There has been a change in how Jetpack initializes the AI. If you notice anything irregular in the generated texts, like incoherence, sensitive or controversial topics, wrong Markdown formatting, or anything else that doesn't look like it was written by a "ghostwriter" - please report it. You can also test the case when you provide a [custom prompt](https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-openai-api) yourself:

- Add an AI Assistant block
- Click on Set system custom prompt in the sidebar
- Provide a custom system prompt
- Send a request
- Check that the provided system prompt is used.

There have been changes to the prompt that asks the user to upgrade to a paid plan. To make sure it works properly:

- On a Jetpack site, send 20 requests for the AI Assistant.
- Confirm you see the upgrade banner.
- Confirm when you see the upgrade banner after a request, the spinner for the AI request goes away.
- Confirm the console doesn't show any errors.
- Check that the upgrade flow works and the user is initially redirected to a price page.
- On an Atomic site, check that the upgrade prompt is displayed after 20 requests and the user is redirected directly to the checkout page.
- In a site with the 20 free requests already used, create an extended block, like paragraph or heading.
- Check that the AI extension menu is still enabled.

A new feature has been released to the users: the "Get Feedback" feature. To test it:

- Write a post.
- Open Jetpack sidebar or start to publish the post.
- Ask for feedback.

## Contact Forms

- Create a Form and add a Dropdown field.
- Make the dropdown required and publish the page.
- Go to the published page and try to submit the form without selecting a value for the dropdown.
- You should see a validation error message and the form shouldn't be submitted.

## Top posts widget

Moving towards full support for browser native functionality, we have added a srcset property to thumbnails in the top posts widget. The browser will automatically pick the most appropriate image from the options in the srcset, depending on the screen pixel ratio and the current zoom value. To ensure that top posts work correctly:

- Add a "Top Posts" widget to your test blog.
- Configure it to display as an image list or image grid.
- Load a test page and ensure that thumbnails display correctly.
- Find a thumbnail whose source is a post image (not a gravatar or blavatar), and ensure that it has a srcset with different pixel ratios (up to 4x, if the source image is large enough).

To ensure that related posts continue to work correctly after the refactor:

- Enable the "Related Posts" feature for your test blog (Settings -> Traffic -> Show related content after posts).
- Enable related posts thumbnails (Show a thumbnail image where available in the same place).
- Open a post that has related posts with thumbnails.
- Smoke-test for any breakage.
- Verify that the thumbnails include a srcset with different pixel ratios (up to 4x, if the source image is large enough).

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
