## Jetpack 15.6

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Social: New Preview & Customization Modal (V2)

> **Important:** The new Social UI is behind a feature flag. It is enabled on the provided test sites via a blog sticker (`jetpack-social-unified-ui-v1`). If you create your own test site, you will **not** see the new changes unless the sticker is applied.

#### Prerequisites

- Use the provided test sites above — they already have the blog sticker and some social accounts connected

#### Test 1: Preview modal — use paid plan site

1. Create a new post editor and open the Jetpack/Social sidebar
2. Click "Preview and customize" to open the modal
3. Verify the two-column layout: customization on the left, preview on the right
4. Toggle between "Same for all" and "Customize each" modes
5. In "Customize each" mode, verify the legend shows "Customizing for [connection name]"
6. Select a connection with a long name (e.g. Mastodon) and verify the legend truncates with ellipsis
7. Verify the connection toggle ("Share to…") appears above the preview section
8. Verify the customization mode toggle is sticky when scrolling
9. Click on the "Publish" button
10. Confirm that the preview modal shows up with a checkbox, "Always confirm before publishing".
11. Uncheck the checkbox and publish the post
12. Create a new post and verify that the preview modal does not show up after clicking "Publish"

For actually customizing per network:

1. Open the preview modal on a published post
2. Toggle "Customize each network"
3. Expected: You can write a different custom message for each connected account
4. Expected: You can set different media for each account
5. The sidebar should show a message indicating per-network mode is active (not the global customization form)
6. Share or schedule the post
7. Expected: Each network receives its customized content

#### Test 2: Active connection indicator (#47218)

1. Connect multiple social accounts (ensure at least one is enabled and one is disabled)
2. Open the Social preview modal
3. Verify that enabled connections show a small colored dot at the top-left of the avatar icon
4. Verify that disabled connections do not show a dot
5. Toggle a connection off and confirm the dot disappears; toggle it back on and confirm it reappears

#### Test 3: Free plan experience (use the free plan site)

1. Open the preview modal
2. Verify the "Customize each" option is not available
3. Verify the layout shows customization on the left and preview on the right without the per-network toggle
4. Verify that there is an upgrade upsell in the customization section.

### Social: Link Previews (#47142, #47153)

#### SEO panel previews

1. Create or edit a post/page in the block editor
2. Open the right sidebar and find the "Optimize SEO" panel (it has moved from the Jetpack sidebar to Document Settings per #47045)
3. Click the "View previews" button
4. Verify: A modal opens with tabbed previews for Google Search, X, Facebook, Threads, LinkedIn, Nextdoor, Tumblr, Mastodon, and Bluesky
5. Verify: The previews show the correct title, description, URL, and image from the post
6. Set a custom SEO title and description — verify they are used in previews instead of the post title/excerpt
7. Set a featured image — verify it appears in the previews
8. Remove all images and switch to the Threads tab — verify a notice says an image is required

#### Pre-publish panel

1. Click "Publish" to open the pre-publish sidebar
2. Verify a "View previews" button is shown in the SEO section
3. Click it and verify the same preview modal opens

### Forms: Email Notifications (#47022, #47160)

1. Create a Jetpack Form block with multiple field types (text, email, textarea, select, radio, checkbox, phone, URL, rating, file upload)
2. Also add an **image-select** field (upload a few images, enable labels)
3. Submit the form from the frontend
4. Check the notification email
5. Verify each field renders with: an icon on the left, the label in gray above the value, and type-specific value formatting (chips for select/radio, stars for rating, clickable links for URL/phone)
6. Verify a 1px border separates each field row
7. Verify image-select choices display as cards with thumbnails, letter codes, and labels

### Forms: New Blocks Allowed in Forms (#47121)

1. Create a new Jetpack Form block in the block editor
2. Inside the form, try adding an **Accordion** block, a **Details** block, and an **Icon** block
3. Try adding an **Icon** block inside the file upload dropzone
4. Expected: All blocks are allowed, render correctly in the editor, and display properly on the frontend
5. Submit the form and verify the response is recorded correctly in Jetpack > Forms

### Reader (#46781, #47033, #47089)

#### Admin bar link auto-enable

1. Connect a brand new test site to WordPress.com for the first time
2. After connection, verify that the Reader module is active and the Reader link appears in the admin bar
3. Deactivate the Reader module from Jetpack > Settings
4. Disconnect and reconnect the site
5. Verify the module is **not** re-activated — the user's choice to disable it should be respected

#### Discover card

1. On a site connected to WordPress.com, go to Jetpack > Settings > Reader
2. Check the contents and link appearing at the top of the page
3. Expected: A "Discover" card highlighting the benefits of the WordPress.com Reader
