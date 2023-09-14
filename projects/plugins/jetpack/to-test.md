## Jetpack 12.5

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### WooCommerce Analytics

Remove logic that prevents site admins being tracked and add store_admin property to WooCommerce analytics events
- Ensure site is connected, WooCommerce is installed, products, payment methods, and shipping methods are available. (Cash on Delivery and Free shipping will be fine).
- Ensure WooCommerce analytics is running.
- As an admin user: add an item to your cart and go to the checkout.
- Check out and then visit Tracks and find your event. (I spoofed my user agent so I could find the event easily)
- Check the event for the `store_admin` property, which should be `1`
- Repeat as a logged _out_ (e.g. guest) user, the event should be logged, and should have the `store_admin` property but it should be `0`
- Repeat as a logged in, but _not_ admin user, (e.g. a customer), the event should be logged, and should have the `store_admin` property but it should be `0`

### Enabling beta blocks

Testing most features on this list requires enabling Jetpack beta blocks. You can be the one of the first to test upcoming features by adding this constant as a snippet, or directly into your configuration file:

```
define( 'JETPACK_BLOCKS_VARIATION', 'beta' );
```

### Social Auto Conversion

- Turn off Social and have Jetpack enabled.
  - Go to the Jetpack settings page and turn on the auto conversion setting.
  - Open up the editor and create a new post.
  - Select a media file that is convertible, but not valid for some connections - for example a 10Mb jpg image.
  - You should see the notice that it will be converted. If you dismissed already, remove the `jetpack_social_dismissed_notices` option to bring it back.
  - On the notice click change settings button. It should open up Jetpack settings on the sharing screen.
  - Turn off the auto conversion.
  - Go back to the editor, the page should reflect the changes without needing to refresh.
- Do the same with Jetpack Social enabled only. The only difference is that the button should direct you to the social admin page.

### AI Excerpt helper

To properly test this ensure that beta blocks are enabled.

- Go to the block editor.
- Open the post sidebar.
- Confirm the Excerpt panel is there when:
  -	beta extensions are enabled;
  - AI Assistant block is enabled.

- Go to the block editor, open the block sidebar.
- Look at the AI Excerpt panel.
- Confirm that the Accept button is initially disabled.
- Request an excerpt.
- Confirm that you can discard the changes by clicking on the Discard button.
- Request an excerpt.
- Confirm that Accept button gets enabled once the requests finishes.
- Confirm you can use the suggestion by clicking on the button.
- Confirm the Generate button gets disabled when the request is done.
- Confirm the Generate button gets enabled right after clicking on the Accept or Discard button.
- Request an excerpt
- Confirm that after changing the number or words the Generate button gets enabled again.

### Create with Voice AI helper

To properly test this ensure that beta blocks are enabled.

- Go to the block editor.
- Create a "Create with voice" block instance and confirm that the block shows its toolbar.
- Confirm now it's possible to remove the block.
- Start to record/pause/resume.
- Confirm how the block button changes according to the recording status.
- Start to record.
- Confirm the block shows the current time duration.
- Stop recording.
- Confirm the Done button is there, and start, pause, and resume actions work fine.
- Confirm the block shows the audio player.
- Confirm you can listen to the recorded audio.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
