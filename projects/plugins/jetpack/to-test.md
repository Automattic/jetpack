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
