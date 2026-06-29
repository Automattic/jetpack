## Jetpack 16.0

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### VideoPress: enqueue player scripts once when a page has multiple videos ([#49716](https://github.com/Automattic/jetpack/pull/49716))

- Spin up a site with the Jetpack plugin and VideoPress module active (Note: not the VideoPress standalone plugin).
- Create a post and add two or more videos using the `[videopress <guid>]` / `[wpvideo <guid>]` shortcode.
- View the post on the front end and open the browser dev tools Network tab (filter for `videopress-iframe.js`).

Example guids: `O19sZueC`, `dfvYSdG3`.

### Daily Writing Prompt dashboard widget on self-hosted Jetpack sites ([#49491](https://github.com/Automattic/jetpack/pull/49491), [#49525](https://github.com/Automattic/jetpack/pull/49525))

- On a self-hosted site running this branch, connect Jetpack to WordPress.com.
- Go to wp-admin → Dashboard and confirm the Daily Writing Prompt widget appears in the side column and loads today's prompt. The Reader link should open in a new tab.
- Disconnect Jetpack (or enable offline mode, e.g. `define( 'JETPACK_DEV_DEBUG', true );`) and reload the Dashboard: the widget should no longer be registered.
- Check the links in the widget, ensure that everything works as expected.

### Jetpack Social: message templates

_Requires: A paid Social plan._

- Go to Jetpack → Social and confirm the Default share message section is visible.
- Enter a template such as `New post: {title}\n\n{excerpt}\n\n{url}`. Confirm it autosaves, survives reload, and the Available placeholders popover lists supported tokens.
- Expand a connected account row and confirm "Custom message for this connection" is available. Save a connection-specific template, reload, and confirm it persists. The row should stay interactive while autosaving.

**Editor and preview:**

- Create a post with a title, body, excerpt, tags, a featured image.
- Open the Social preview/customization UI. In "Same for all" mode, confirm placeholders render as real values in previews, not literal `{title}` / `{excerpt}` text.
- Change the post title/body/excerpt without saving. Confirm previews refresh after debounce and use the unsaved editor values.
- Add a long message/body and confirm long previews show "See more / See less" where expected, without cutting important URL/title content.
- If any connection has a custom template, a fresh post should default to "Customize each". If no connection templates remain, fresh posts should stay "Same for all".

**Per-network and publishing:**

- In "Customize each" mode, confirm a connection with a saved template uses that template; connections without one fall back to the site template, then network default.
- Type a one-off per-connection message override and publish. The actual shared post should match the preview and use the override.
- Test a template without `{url}`. The preview should not invent a trailing URL in the caption. Threads should still show a link preview card.

**Optional regression checks:**

- On a free/non-eligible site, the message-template UI should not appear.

### Donations block in newsletter emails ([#49963](https://github.com/Automattic/jetpack/pull/49963))

_Requires: A connected Stripe account; a Donations block with at least one interval (one-time/monthly/yearly) enabled._

1. Publish a post with a Donations block.
2. Customize a heading and a button label.
3. Preview the post as an email.
4. Confirm each enabled interval shows its heading, text, and a **button** (not a plain link), the custom text carries through, and buttons link to the post.

### Forms: shareable file-download links ([#49868](https://github.com/Automattic/jetpack/pull/49868))

_Requires: a second user with the Editor role._

1. Create a Form with a file-upload field and submit a response that includes a file. As an admin, open the Form responses dashboard and download/preview the uploaded file - it downloads as before.
2. Cross-user (the fix): log in as a different user with the Editor role and open the same download link - it now downloads successfully (previously this returned "Invalid nonce.").
3. Optional hardening checks: tampering the `token` in the download URL fails with "This download link is no longer valid. Reload the responses page to get a fresh link. (2)" (tampering `token_version` gives the same message but code (1)); a link whose `expires` is in the past fails with "This download link has expired. Reload the responses page to get a fresh link."

**Thank you for all your help!**
