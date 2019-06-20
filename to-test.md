## 7.5

### Magic Links

This feature introduces a new option in the Jetpack dashboard. If you use one of the mobile apps, you'll now be able to send an email to yourself, from the Jetpack dashboard, with a magic link that will allow you to log in to the mobile app in one click. We would invite you to test two scenarios:

**Testing the error case:**

1. Ensure that Jetpack site is connected to a test account that **is** an Automattician account
2. Go to Jetpack > Dashboard
3. Click Connect to mobile WordPress app link. That link appears in the Connection area.
4. Ensure modal pops up
5. Click Send Link button
6. Ensure that an error message occurs (this is due to you being connected to an Automattician account)
7. Disconnect site

**Testing the success case:**

1. Reconnect site to a WordPress.com test user that **is not** an Automattician account
2. Click Connect to mobile WordPress app link
3. Ensure modal pops up
4. Click Send Link button
5. Ensure that you receive email with magic link


### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticible and report anything you see.

**Thank you for all your help!**
