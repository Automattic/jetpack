## Jetpack 11.9

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Form Block

The Form block received several updates, to test:

- Create a new test post and add a Form block (contact form template will work).
- Add a 'Multiple Choice (checkbox)' field with a few options to select from.
- Add a 'Text Input Field' with some dummy 'Placeholder Text' in the sidebar settings. Then change the border-radius for the text field to a large value.
	- While editing or viewing the form on the frontend, the placeholder text should remain visible even with a large border-radius set.
- While still having the text input field selected, make sure the 'Sync fields style' is enabled. Then, change the background color or other style settings from the sidebar.
- Add an additional text input field. This new field should retain the same style settings previously applied from the other text field.
- On the frontend in a new private/guest browser window, submit a test form submission.
	- You may notice the form having a brief blur while while it is loading, this is expected.
- Check the form responses in 'Feedback > Form Responses' for the test submission. Make sure that the output looks ok and that you don't see an 'Array()' wrapped around the multiple choice checkbox field data.

Related PRs: [28815](https://github.com/Automattic/jetpack/pull/28815), [28988](https://github.com/Automattic/jetpack/pull/28988), [28820](https://github.com/Automattic/jetpack/pull/28820), [28973](https://github.com/Automattic/jetpack/pull/28973)

### Sharing Buttons

The Sharing buttons also received updates in this version, to test:

- Verify that the sharing buttons are enabled in 'Jetpack > Settings > Sharing'.
- Click on the 'Configure your sharing buttons' link.
- Add some different sharing buttons including the new Mastadon button. Save those changes.
- Have at least one blog post published, then visit a post on the frontend.
- Make sure the sharing buttons are displayed as expected.
	- Be sure to test the sharing buttons displayed on the frontend in a variety of different browsers and screen sizes.
	- If you aren't seeing any sharing buttons at all, try disabling any adblock extensions.
- Activate the 'Twenty Nineteen' theme on your site and check the sharing buttons on the frontend again, they should look the same.
- Test additional sharing button settings such as 'official buttons' versus 'icon only' for example.

Related PRs: [28874](https://github.com/Automattic/jetpack/pull/28874), [28694](https://github.com/Automattic/jetpack/pull/28694)

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack/blob/jetpack/branch-11.9/projects/plugins/jetpack/CHANGELOG.md). Please feel free to test any and all functionality mentioned! 

**Thank you for all your help!**
