## Jetpack 11.8

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Form Block

The form block received updates for styling the input fields, to test:

- Create a new test post and add a Form block.
- When presented with the different form variation templates, make sure there aren't any design oddities with the updated icons.
- Select the 'Contact Form' type for this example.
- Click on one of the input fields in the inserted Form block, and in the sidebar for the block settings there should be 'Color' and 'Input Field Styles' sections.
- Try adjusting some of the style settings for the input fields, saving, and make sure the published post looks okay on the frontend.

### Subscribe Block

The Subscriptions module received several changes in this version, to test:

- On a Jetpack-connected test site, add a Subscribe block to a new post.
  - Make sure Subscriptions are enabled first, via Jetpack -> Settings -> Discussion.
- In the block settings sidebar, under Settings, there should be a toggle to include social followers in the count. Make sure the follower amounts match the subscribers and connected social followers, if there are any.
- If you have a social network connected via the WordPress.com dashboard at Tools -> Marketing -> Connections, you can also test the social followers are included when publishing if the toggle is enabled.
- Publish the post with your Subscribe block. Next, visit the published post and subscribe one of your email addresses to receive new post notifications.
  - For the purposes of this test, make sure the email address is not connected to a WordPress.com account. If you are using Gmail, you can use the '+' symbol to create an alias such as 'example+20230130@gmail.com'
  - Make sure to confirm the subscription by clicking the link in the confirmation email.
- Publish another new post with some text content. Make sure the email address you subscribed receives the new post email notification.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack/blob/jetpack/branch-11.8/projects/plugins/jetpack/CHANGELOG.md). Please feel free to test any and all functionality mentioned! 

**Thank you for all your help!**
