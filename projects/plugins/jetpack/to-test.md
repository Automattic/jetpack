## Jetpack 11.9

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Blocks

Some blocks were moved from beta status to production and are now available to all users.
No new features were added, so the only thing to test here is that they work as expected and show up without the beta blocks being enabled:

**VideoPress** - add a block and try adding and playing a video.

**Cookie consent block** - Make sure you are using a block theme. Go to the site editor and try adding a Cookie consent block.

**Writing prompt block** - Create a new post and add a Writing prompt block to it. Save or publish the post and check if appropriate tags, such as dailyprompt, dailyprompt-1810 are added.

### The Form block

**Multiple Choice and Single Choice** fields had some design updates. To test it:

- Create a post and a Form block.
- Include a Multiple Choice and a Single Choice field.
- Check if they work as expected.
- Publish the post and check if it looks as expected on the frontend.
- Multiline feedback message support:
- Create and publish a post that includes a contact form
- Submit a multi-line message through a form
- Look at Feedback->Form Responses and make sure the message is not showing up as a single line.

### Golden ticket

- Go to the golden-token MC tool https://mc.a8c.com/jetpack/golden-token/
- Generate a new license key and assign it to your test site using URL or the Blog ID
- Go to /wp-admin/admin.php?page=jetpack#/my-plan
- Verify that the Jetpack Golden Token plan appears

### WordPress 6.2 compatibility

This version of Jetpack included several small fixes to ensure it’s compatible with the latest WordPress. Most test sites are already set to use the WordPress 6.2 RC version. However, if you are using Jurassic Ninja, Atomic, or your standalone site, you may need to install the WordPress beta tester plugin, or you have set it up to use the appropriate version in some other way (through the Pressable dashboard). Also, by the time you try testing, the WP 6.2 may already be published.

### Things to check:

#### Twitter block

- Create a new post and add a Twitter block.
- paste a Twitter URL for a thread (tweetstorm).
- Click on Unroll.
- Change Publicize options to publish a thread instead of a single tweet.
- Watch the separators added to the post content.
- Click on the "Social Previews" section at the bottom of the sidebar.
- You should see previews under some of the tweets, and you should not see any notices in your logs.

### Pinterest block

- Go to Posts > Add New and add a Pinterest block. When adding a Pinterest URL, no Fatal error should appear in your logs.
- Install the WordPress Beta tester and switch to WP's Bleeding edge option.
- Update to WP 6.2 latest Beta in Dashboard > Updates
- Go to Posts > Add New and repeat your test. The Pinterest block should still trigger no fatal error.

### Mobile navigation

**Use a WoA site.**

- Open the wp-admin of the site on mobile (or simulate the mobile in your desktop browser)
- Click the WordPress logo in the left-hand top corner to open the unified navigation
- Click the WordPress logo again, and make sure the navigation closes.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack/blob/jetpack/branch-11.9/projects/plugins/jetpack/CHANGELOG.md). Please feel free to test any and all functionality mentioned! 

**Thank you for all your help!**
