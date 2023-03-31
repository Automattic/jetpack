## Jetpack 12.0

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Blocks

Some blocks were moved from beta status to production and are now available to all users.
No new features were added, so the only thing to test here is that they work as expected and show up without the beta blocks being enabled:

**VideoPress** - add a block and try adding and playing a video.

**Cookie Consent block** - make sure you are using a block-based theme such as "Twenty Twenty-Three". Go to the site editor and try adding a Cookie consent block.

**Writing Prompt block** - create a new post and add a Writing Prompt block to it. Save or publish the post and check if appropriate tags, such as 'dailyprompt' and 'dailyprompt-1810' are added.

### The Form block

**Multiple Choice and Single Choice** fields had some design updates. To test it:

- Create a post and add a Form block.
- Include a Multiple Choice and a Single Choice field.
- Check if they work as expected.
- Publish the post and check if it looks as expected on the frontend.
- Multiline feedback message support:
- Create and publish a post that includes a contact form.
- Submit a multi-line message through a form.
- Look at Feedback->Form Responses and make sure the message is not showing up as a single line.

### WordPress 6.2 compatibility

This version of Jetpack included several small fixes to ensure compatibility with the latest WordPress. WordPress 6.2 is now available to all users, so make sure you update your site to the latest version.

### Things to check:

#### Twitter block

- Create a new post and add a Twitter block.
- Paste a Twitter URL for a thread (tweetstorm).
- Click on Unroll.
- Change Publicize options to publish a thread instead of a single tweet.
- Observe separators being added to the post content.
- Click on the "Social Previews" section at the bottom of the sidebar.
- You should see previews under some of the tweets, and you should not see any notices in your error logs.

### Pinterest block

- Create a new post and add a Pinterest block. When adding a Pinterest URL, no errors should appear in your logs.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack/blob/jetpack/branch-12.0/projects/plugins/jetpack/CHANGELOG.md). Please feel free to test any and all functionality mentioned! 

**Thank you for all your help!**
