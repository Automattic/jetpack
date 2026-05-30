## Jetpack 15.9

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

### Donations Block

- Add a Donations Form block and confirm the existing in-page display mode still works.
- Configure donation frequencies, default frequency, per-frequency default amounts, suggested custom amount, and min/max donation amounts.
- Confirm the block prevents disabling every frequency.
- Test border, color, typography, spacing, active tab color, and selected amount color settings in the editor and frontend.
- Use the content alignment control and confirm left, center, and right alignment work in the editor and frontend.
- Confirm the Donate button and form inherit theme styles where expected.
- Switch the block to Pop-up mode and confirm the editor shows a trigger button instead of the full form.
- Change the button text, toggle icons, and try the available icon choices.
- View the page on the frontend, open the pop-up, and confirm the form opens in a modal.
- Close the modal with Escape, the backdrop, and the close button.
- Confirm keyboard focus stays inside the modal while open and returns to the trigger when closed.
- Enable Sticky mode and confirm the trigger remains visible while scrolling.
- Insert the new Tips variation and confirm it uses coffee-themed defaults, sticky pop-up mode, one-time/monthly amounts, and no annual/custom amount defaults.

### Image Studio and Feature Clips

- On a site where Image Studio is enabled and the plan supports video uploads, confirm the video clip generation entry point appears in the editor.
- On sites where Image Studio is disabled or video uploads are unsupported, confirm the clip entry point is hidden.
- Generate a short clip and confirm it is saved as a video attachment in the Media Library.
- Save and reload the post, then confirm the generated clip remains connected to the post.
- Watch for unclear rate-limit, safety-filter, failed-generation, or unsupported-plan states.

### Reader Chat

- On an eligible connected site, enable Reader Chat from the Jetpack Search settings surface.
- View the public frontend and confirm the chat widget appears.
- Ask a question based on public site content and confirm the answer is grounded in that content.
- Confirm the widget does not appear on Coming Soon or unlaunched sites.
- Watch for broken eligibility states, raw errors, or confusing rate-limit messages.

### Jetpack Search

- Open `wp-admin/admin.php?page=jetpack-search` and confirm the URL normalizes to `#/overview`.
- Open `wp-admin/admin.php?page=jetpack-search#/settings` and confirm Settings opens directly.
- Click between tabs and confirm browser Back returns to the previous tab.
- From Jetpack's Performance page, use the "Manage Search settings" link and confirm it opens Search settings.
- Toggle AI Agent Access in the Search dashboard, save, reload, and confirm the setting persists.
- Use the public search UI and confirm autocomplete suggestions appear as you type.

### Jetpack AI Sidebar: AI Editorial Review

- On a connected site with Jetpack AI access, open a saved draft post in the block editor.
- Confirm the Jetpack AI sidebar appears for posts.
- Run AI Editorial Review and confirm the result renders in the sidebar.
- Select a paragraph or heading and try the visible block-level suggestions.
- Confirm AI Editorial Review does not appear in the page editor.

### Newsletter

- On a fresh connected Jetpack site, confirm the Newsletter / Subscriptions module is active by default.
- On an existing connected site, confirm the module becomes active after upgrade when it has not been explicitly disabled.
- If you manually disable the module, confirm Jetpack respects that choice and does not re-enable it.
- In Jetpack > Settings > Newsletter, enable Newsletter categories, select categories, save, then save again without changes. Confirm the second save succeeds.

### Forms

- Open the block editor and insert or edit a Form block.
- Confirm the Form block works normally.
- Check the browser console and confirm there is no `Uncaught TypeError: n[e] is not a function` error.

### Podcast and Create AI Podcast

- On an eligible WordPress.com Simple or Atomic site, open Jetpack > Podcast and confirm the Podcast dashboard loads without console errors.
- If the setup screen appears, choose a post category and confirm the main Podcast tabs load.
- If available, open Media > Create AI Podcast and start a generation from recent posts or selected posts.
- Confirm generation shows clear progress, credit, success, or failure states, and that a successful draft can be opened and edited.
- On a site where Podcast is not available, confirm Podcast entry points are hidden or show a clear eligibility message.

### Abilities API and agent-facing features

- If the WP Abilities API is available, confirm Jetpack abilities appear only when their module/product gates are satisfied.
- Confirm Shortlinks abilities require edit-posts access.
- Confirm Sitemaps status reads and rebuild dispatch work when Sitemaps is active.
- Confirm Related Posts ability requests can fetch related posts and respect configured result limits.

### Regression checks

- Duplicate a post with backslashes in the title, content, and excerpt. Confirm the backslashes are preserved.
- Render a Google Maps shortcode with encoded characters in the place name and confirm the intended place text is preserved.
- Configure a site-wide Social message template and publish/share a post without a per-post custom message. Confirm Social uses the site-wide template.
- In VideoPress, upload a first video from the admin dashboard and confirm the "Add new video" button remains visible afterward.
- In Site Verification, save a raw verification code and confirm the rendered `<meta>` tag has no trailing slash.

### General smoke testing

- Open Jetpack dashboard, My Jetpack, Settings, Search, Newsletter, AI, and the block editor.
- Check browser console errors on each major screen.
- Test common publish, settings-save, and product/upgrade flows.

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
