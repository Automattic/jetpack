## 9.4

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Blocks

#### Podcast Player Block

In anticipation of further changes to the Podcast Player Block and its integration with other Jetpack blocks, we've made a number of changes to the Podcast Player block. Here is what you can try:

- Insert a new block, and add a podcast
- Try adding different podcast URLs: an RSS feed URL, or the URL of page with one or more podcasts in it.
- You should now see skip back / forward buttons that you can use in the editor and on the frontend.

#### Payments Block

We've made a number of changes to the Payments block in order to be able to implement the Premium Content Block (which uses the Payments block button). You'll want to make sure the Payments block still works:

- Try adding a block on a free site, and follow the upgrade prompts.
- Try adding a block on a site with a plan, and follow the prompt to connect to Stripe.
- Try using the block.

### Dashboard

This release introduces a new page in the Jetpack dashboard: the new Recommendations tab will help you get started with recommended features of Jetpack.

To test this, try the following scenarios:

**Initial prompts flow:**

1. Start with a free site and navigate to `/wp-admin/admin.php?page=jetpack#/recommendations`.
2. Verify that you are redirected to `/wp-admin/admin.php?page=jetpack#/recommendations/site-type`.
3. Ensure that you have not selected "Store" and click "Continue".
4. Verify that you navigate to `#/recommendations/monitor`.
5. Click back in your browser and select "Store", then click "Continue".
6. Verify that you navigate to `#/recommendations/woocommerce`.
7. Navigate to `/wp-admin/index.php` and then back to `/wp-admin/admin.php?page=jetpack#/recommendations`.
8. Verify that you are redirected to `#/recommendations/woocommerce`.
9. Choose "Decide later for each of the prompts and verify that you are taken successively through `#/recommendations/monitor`, `#/recommendations/related-posts`, `#/recommendations/creative-mail`, and `#/recommendations/site-accelerator`.
10. Verify that the summary screen has no recommendations enabled.
11. Now return to `#/recommendations/monitor` and go back through the flow, selecting some recommendations and skipping others. Verify that the summary screen reflects your choices.
12. Enable the remaining recommendations on the summary screen and verify that it updates to reflect these changes.
13. Check the various "Learn more" and "Settings" buttons for each feature and make sure they are appropriate for that feature.
14. Check that the "View all Jetpack features' link works.

**Summary upsell flows:**

1. On a free site visit `/wp-admin/admin.php?page=jetpack#/recommendations/summary`.
2. Verify that an upsell prompt for Backup Daily shows.
3. Sandbox your site and in wpcom edit `/wp-content/rest-api-plugins/endpoints/jetpack-recommendations.php` so that the `WP_REST_Response` in `get_upsell()` returns `'hide_upsell' => true`.
4. Reload `#/recommendations/summary` and verify that the fallback sidebar upsell is displayed (no prices or product names should show).
5. Upgrade the site to Backup Daily.
6. Return to `#/recommendations/summary`. If the app sidebar prompt is displaying, wait a few minutes for Rewind to update, then reload the page.
7. Verify that the one-click restores prompt is displaying.
8. Use the prompt to add your credentials and then return to `#/recommendations/summary`. Verify that the "Manage your security" prompt displays in the sidebar and that the link works.
9. Start another free site and upgrade it to a paid plan that doesn't include backup or scan (e.g. anti-spam).
10. Navigate back to `#/recommendations/summary` and verify that the app sidebar prompt shows and that the app badges work.

**Jetpack plugin upgrade flow:**

1. Start with a site on an old version of Jetpack that includes the Setup Wizard (9.3 meets this criteria).
2. Use the Code Snippets plugin and add the following snippet to enable the Setup Wizard:

```php
add_filter( 'jetpack_show_setup_wizard', '__return_true' );
add_filter( 'jetpack_pre_connection_prompt_helpers', '__return_true' );
```

3. Navigate to `/wp-admin/admin.php?page=jetpack#/setup/features` and click "I'm done for now" to complete the Setup Wizard.
4. On that site upgrade Jetpack so that it includes the Recommendations.
5. Verify that the Recommendations are not available from the dashboard, and that `#/recommendations` redirects to `#/dashboard`
6. Perform the above steps again but this time do not complete the Setup Wizard and verify that the Recommendations are available.

### Sharing

In this release, we've removed the jQuery dependency of the Sharing buttons. To test this out, we would recommend the following:

- Add multiple buttons to your site, including the Email sharing button, and hide some behind the "More" button.
- Try using the different button styles
- Ensure that the buttons work well.


**Thank you for all your help!**
