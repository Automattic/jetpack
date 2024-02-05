## Jetpack 13.0

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### AI Assistant

NOTE: keep in mind, all the following should be tested on mobile views as well.

- Have AI enabled on your site
- Insert an AI Assistant block, confirm:
  - Initially it shows a single "Cancel" button, clicking it will remove the block
  - Once text is typed in the input, "Cancel" button will toggle for main prompt action "Generate"
  - Once AI has responded, suggestion actions (icon buttons) show:
    - "Back to edit": focus back at the text input (also triggered by simply editing the input text)
    - "Discard": rejects the AI suggestion and removes the AI Assistant block
    - "Regenerate": requests the same prompt to the AI
    - "Accept": accepts the suggestion (turning it into its own block) and removes the AI Assistant
- Invoke the AI Assistant on already existing content, see that it behaves consistently with the above
- Use some of the one-click AI actions on already existing content (translate, summarize, etc)
  - Once action is done the described suggestion actions show, but there is no "Back to edit" and "Regenerate" is disabled
- When content is larger than viewport, AI Assistant block will remain floating at the bottom of the viewport (desktop only, on mobile it remains fixed at the top)

### Stats Blocks

There are two new blocks in beta that utilise stats data: the Top Posts & Pages block and the Blog Stats block.

- Enable beta blocks on your site
  - You can do this by inserting the following snippet in the `wp-config.php` file: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
- Create a new post and insert the two blocks.
  - Both blocks should prompt you to activate the Stats module if it's disabled.
  - You should also be able to convert the Legacy Widgets into the new blocks.
- Please remember that views are only counted when the Stats module is active and when you're logged out. They are also cached for five minutes.

#### Top Posts and Pages Block

- There should be two layouts available from the Block Toolbar: the Grid layout and List layout.
- The settings should be feel intuitive, and they should all function appropriately.
  - Number of items: the number of posts displayed in the block.
  - Stats period: the timeframe for which to check top posts. For example, "7 days" should return the posts with the most views across the last week.
    - If you do not have enough content that has accumulated views in that timeframe, the block should draw on random posts.
    - It should not include password-protected or private content.
  - Items to display: filters out different content types (eg. posts or pages) depending on what you'd like the block to include.
  - Metadata settings: control what the block shows, such as the date or post author.
  - Style settings: the block should allow you to choose colours, margin, padding and fonts if your theme has opted in to that feature.
- Confirm that all these settings work as expected, and that the block displays correctly on the front-end.

#### Blog Stats Block

- There are two options to draw on: Views and Visitors.
  - These should match the statistics shown in your Dashboard.
- Unlike the Legacy Widget, you can now also show stats data for individual posts.
  - In order to test this, it's recommended that you insert the block into a template within the Site Editor.
  - We do not collect Visitor data for individual posts. As such, you shouldn't be able to select "Visitors" and "This individual post" when adding the block.
- In all cases, confirm that the block correctly loads on the front-end and contains the appropriate statistic.

### WooCommerce Analytics

Remove logic that prevents site admins being tracked and add store_admin property to WooCommerce analytics events

- Ensure site is connected, WooCommerce is installed, products, payment methods, and shipping methods are available. (Cash on Delivery and Free shipping will be fine).
- Ensure WooCommerce analytics is running.
- As a shop manager user: add an item to your cart and go to the checkout.
- Check out and then visit Tracks and find your event. (I spoofed my user agent so I could find the event easily)
- Check the event for the `store_admin` property, which should be `1`
- Repeat as a logged _out_ (e.g. guest) user, the event should be logged, and should have the `store_admin` property but it should be `0`
- Repeat as a logged in, but _not_ admin user, (e.g. a customer), the event should be logged, and should have the `store_admin` property but it should be `0`

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
