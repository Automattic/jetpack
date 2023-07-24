## Jetpack 12.3

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### AI Assistant:

Jetpack AI Assistant has received various feature enhancements and bug fixes this release. In addition to creating fresh content, you can now use the AI Assistant to revise and enhance existing blocks such as the Paragraph or List blocks.

- Make sure your Jetpack site is connected to WordPress.com
- To test the AI Assistant block directly, simply add the AI Assistant block to any page or post, and tell Jetpack AI what to do. Pro-tip: type “/ai” to use the block shortcut.
- Alternatively, try leveraging the AI Assistant features from the block toolbar of the paragraph, list, or heading blocks.
- Read more about the Jetpack AI Assistant in our previous blog post: https://jetpack.com/blog/introducing-jetpack-ai-assistant/

### Newsletters

The Newsletter functionality has received various upgrades including a new email preview feature. To test:

- In `Jetpack > Settings > Discussion`, make sure that Subscriptions are enabled.
- Create a new test post and click on Publish. In the publishing panel you will see the "Newsletter visibility" section which has been updated to clarify the audience reach of your post.
- Try clicking on the Preview button in that section to send a test email preview to the current user.

### Tock Block

A new block is now available for the Tock reservations service:

- While editing a post, search for and add the new Tock block.
- The block will ask you to specify the business name, for testing purposes you can try `oquirrh`
- Once your post is published, clicking on the Tock button on the frontend of your site will open a modal for booking.

### Sharing Buttons

We've added a new sharing button for the Nextdoor service:

- In `Jetpack > Settings > Sharing`, make sure that the Sharing Buttons feature is enabled, then click on the "Configure your sharing buttons" link.
- Try adding the Nextdoor sharing button and be sure to save the changes.
- Open a post on the frontend of your site and make sure the Nextdoor sharing button is displayed.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack/blob/monthly/branch-2023-06-26/projects/plugins/jetpack/CHANGELOG.md). Please feel free to test any and all functionality mentioned! 

**Thank you for all your help!**
