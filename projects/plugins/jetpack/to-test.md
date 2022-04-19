## Jetpack 10.8

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### QR Post Feature

QR Post is a new Jetpack feature which automatically generates QR codes for your published posts. When scanned, the QR code will link visitors to the post. Take this feature for a spin by:

- Open an existing published post on your site (or create a new one).
- Click on the Jetpack icon in the post editor, then locate the QR Code section.
- Then click on the "Get QR Code" button to view or download the QR code for the post.
- With a smartphone, try scanning the QR code to test that it forwards to the published post.
- If your site has a custom logo set, it will be shown in the generated QR code image instead of the Jetpack logo.

### Openverse Media Support

[Openverse](https://wordpress.org/openverse/) is a search engine for openly-licensed media which we've added as an extneral media provider. This will allow you to search Openverse for media you'd like to use right from the post editor! To see this in action:

- Open the post editor for a new/existing post.
- Insert an Image or Gallery block.
- Click on "Select Image(s)" for the block you inserted, then choose the Openverse option.
- Search for something you'd like to see images of.
- Once you have chosen your images and clicked "Select", the images will be inserted into the block.

### Google Fonts In Global Styles

We've begun adding support for a selection of Google Fonts available from the Global Styles setting. To test this out, try:

- Have the Gutenberg plugin version 12.8.1 or later installed on your site.
- Activate a block-based theme such as Twenty Twenty Two.
- Turn on the the Google Fonts feature from Jetpack settings: `Jetpack > Settings > Writing > Theme enhancements`
- Next, navigate to the Full Site Editor: `Appearance > Editor`
- Once in the Site Editor, click on the `Styles` icon which is next to the Settings icon.
- Clicking on the `Typography` options will show the subset of Google Fonts which are available for selection, such as: Bodoni Moda, Merriweather, Roboto, or Nunito among others.
- Save your Typography settings and check that the frontend of your site loads content with the selected font.

### Jetpack Block Settings Discoverability

We've improved the discoverability of Jetpack Blocks in settings and added the ability to toggle them if desired:

- Navigate to `Jetpack > Settings`.
- Click on the Search icon and search for "blocks".
- You should see a toggle setting with "Jetpack Blocks give you the power to deliver quality content..."
- That toggle **must** be active by default.
- Try checking out the information tooltip/link for the setting.
- Test that disabling the Jetpack Blocks setting works as expected. If the setting is off for example, you would not be able to insert a Jetpack block such as the Tiled Gallery block.

### Jetpack CRM Installable Via Form Block

Jetpack CRM is now directly installable from the Form block settings. Follow these steps to test:

- If you already have Jetpack CRM on your test site, uninstall it.
- Open a post for editing, and in the editor insert a Form block (Contact type will work fine).
- In the Form block sidebar (ensure you're selecting the parent Form block, and not a child block of the Form block) you will see the "CRM Integration" panel.
- Expand the CRM Integration panel, and follow the prompt to install Jetpack CRM.
- For further testing, head over to the Plugins menu, and deactivate (don't uninstall) the Jetpack CRM plugin.
- Go back to the post editor with your Form block, and you should have an option to activate the plugin which you should do.
- Test that the toggle option to save form entries to the CRM works; it should get saved properly when saving and refreshing the post.
- Head to the Plugins menu again, and use a plugin such as WP Rollback to downgrade to Jetpack CRM version 4.9.0 or earlier.
- Then open your post for editing again, and you should observe a notice that a plugin update is required in the CRM Integration panel section.

**Thank you for all your help!**
