## Jetpack 11.5

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Jetpack Form Block

The Form Block received several updates and bug fixes in this version. To test, try the following:

- Make sure the testing site has Jetpack connected to your account.
- Create a post and add a Form block to it. 
- Hover your pointer between two Form child blocks (e.g., Name and Email in Contact form). The Block Inserter (plus icon with Add block title) should appear allowing you to easily insert new fields between the blocks.
- Check the Dimensions section in the sidebar and make sure it already has padding setting (16 px). Try editing padding.
- Try editing Field widths for different fields and make sure that what you see in the editor matches the frontend preview.
- Add a Contact form and select the Form block container. Make sure the edit button doesn't show up (pen icon). All form settings such as email address and subject line should be available in the sidebar.
- Lose and regain focus on the Form block by clicking inside of it. Clicking the empty space between child elements should select the main Form block.
- See if form related blocks show up in the block library when trying to insert a new child Form block. Try setting the focus on a child block and adding a block. The section with the Form blocks should have a title "FORMS".
- Add a Contact Form and add a Consent block to it (any type). Configure the Email address to send to to your email. Pick "Show summary of submitted fields" as On submit action. Submit the form on the frontend and see that the "Consent: Yes" is visible on the Success page.

### Jetpack Subscription block

Jetpack Social connections are no longer counted in the Subscriptions block. To test, try the following:

- On a Jetpack connected site, enable Jetpack Social and connect to Twitter. You should have at least one follower.
- Create a new post and add the Subscription block.
- Add one e-mail follower to your site and make sure you confirm the subscription (click on a link in the confirmation email).
- Make sure the "Show subscriber count" is turned on in the block settings. You should see your WordPress.com and email followers numbers showing up without the Twitter ones.

**Thank you for all your help!**
