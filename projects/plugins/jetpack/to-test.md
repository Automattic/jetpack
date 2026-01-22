## Jetpack 15.5

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Forms

This release includes several improvements to Jetpack Forms.

#### Webhooks

- Create a form on a self-hosted site
- Open the block sidebar settings
- Verify the Webhooks section is present and functional

#### Form Field Options

- Add a single choice field to a form
- Add multiple options
- Place cursor in the middle of an option and press Enter
- Verify the option splits at the cursor position
- Place cursor at the beginning of an option and press Backspace
- Verify the option merges with the previous option

#### Classic Editor Checkbox Fix

- Open a post in the Classic Editor
- Click "Add Contact Form" button and add a checkbox field
- Insert the form and save the post
- View the post on the frontend and submit with the checkbox checked
- Verify the checkbox value is captured as "Yes" in the form submission

#### Response Exports by Date

- Navigate to Jetpack → Forms
- Filter responses by date
- Click the export button
- Verify the exported responses match the date-filtered responses

#### Form Submission Confirmation Page

- Submit a Jetpack Form with test data
- Verify the confirmation page shows:
  - "← Back" link at the top
  - "Thank you for your response. ✨" heading
  - Fields displayed with labels above values
  - Horizontal dividers between each field

### Social Sharing

#### Accessibility Improvements

- Add a Sharing block to a post via the editor
- Add networks to the sharing block
- Verify the button accessible text is clear and descriptive

### About Page

- Visit the About page in the WordPress dashboard
- Verify plugin icons appear correctly positioned and sized
