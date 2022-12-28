## Jetpack 11.7

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
### Blaze

There have been some behind the scenes changes to Blaze (including renaming, and moving it into it's own package), as well as feature additions. To test:

- Make sure your site is connected to Jetpack and your WordPress.com account is connected. Make sure the site is public.
- On WoA (not Jetpack self-hosted): Publish a new post (or unpublish then republish a post). Notice the post-publish sidebar - it should show a 'Blaze your post' message and button saying 'Blaze'.
- On a Jetpack test site (not WoA): Hover over a post in the posts list (wp-admin/edit.php), and you should see a "promote" link. Clicking it should take you to Blaze page.
### Form Block

The Form Block received several updates and bug fixes in this version. To test:

- On a Jetpack-connected test site, add a Form block. While in the form variation picker, you should see the Salesforce Lead form available.
- Make form fields required and check if the "(required)" text can be changed.
- Add other fields to the form, and check if those fields allow 'empty' labels.
- Save the changes and check if they are applied to the live view.
- On the front-end after adding a Form block, submit a test email, then view the email received in plain text to make sure there are now line breaks. In HTML it should also be properly formatted.
- There have been various other minor UI changes, so make sure that the general Form block user flow and labels / icons appear as they should.

#### Form Responses

As well as changes to the Form block, there is now an option to export form responses to Google Sheets. To test:

- On a Jetpack-connected test site, make sure you have some contact form responses on your test site (showing in the Feedback area in wp-admin).
- From that Feedback area, you should see a single "Export" button. Click it to open the Export modal.
- From the Export modal, use either option to download a CSV file or export to Google Sheets.
- If you didn't successfully connect to Google Drive, the Export button should read "Connect Google Drive").

### Revue Block

The Revue newsletter service is shutting down on 18th January, so as part of preparing for that the Revue block is now no longer discoverable. Existing instances of the Revue block will show a message leading to our WordPress.com article explaining more about the shut-down and how to migrate subcribers to WordPress.com (there is no Jetpack specific article at this time). To test:

- On a Jetpack-connected test site, it is possible to test the Revue block notice on the back and front end by adding the following markup to a post/page: `<!-- wp:jetpack/revue --> <div class="wp-block-jetpack-revue"><a class="wp-block-jetpack-revue__fallback" href="https://www.getrevue.co/profile/undefined">https://www.getrevue.co/profile/undefined</a></div> <!-- /wp:jetpack/revue -->`.
- The editor should now show a message and link related to Revue shutting down, suggesting the block should be removed and adding a CTA to migrate subscribers via WordPress.com.
- On the front-end, if you are logged in as an admin you should see an info notice with similar messaging. View the same post / page whilst not logged in or not as an admin and you shouldn't see that notice.
- Search for the Revue block to add to a post / page - it shouldn't be visible.

### Subscription Block

The Subscription Block received several updates and bug fixes in this version. To test:


- On a Jetpack-connected test site, add a Subscription block. Make sure subscribing is enabled first, via Jetpack -> Settings -> Discussion.
- In the block settings sidebar, under Settings, there should be a toggle to include social followers in the count. Make sure the follower amounts match the subscribers and connected social followers, if there are any.
- If you have a social network connected via the WordPress.com dashboard at Tools -> Marketing -> Connections, you can also test the social followers are included when publishing if the toggle is enabled.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack/blob/jetpack/branch-11.6/projects/plugins/jetpack/CHANGELOG.md). Please feel free to test any and all functionality mentioned! 

**Thank you for all your help!**
