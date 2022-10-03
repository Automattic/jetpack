## Jetpack 11.4

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### Jetpack Recommendations Assistant

There have been updates for the Jetpack Recommendations Assistant. In particular, there is a recommendation for agency managed sites [#26302], and mobile app store links are now shown based on device type [#26093].

**To test the agency specific recommendation, try:**

- With the Jetpack Beta Tester [plugin](https://jetpack.com/download-jetpack-beta/) activated, and the 11.4-beta branch active, on the main dashboard page `/wp-admin/admin.php?page=jetpack#/dashboard` there is an option in the footer to "Reset Options (dev only)" which can be used to reset the recommendation steps if they have already been completed.
- Navigate to `/wp-admin/admin.php?page=jetpack#/recommendations/site-type`
- Select "This is a personal site".
- Then select "Continue", it should skip straight to the Downtime Monitoring recommendation.
- Navigate back to `/wp-admin/admin.php?page=jetpack#/recommendations/site-type`
- This time, select the "I build or manage this site for a client" option.
- Select "Continue" and this time you should get the new agencies recommendation.
- On the agency screen, test that the "Learn More" and "Get Jetpack for Agencies" links work.
- Click "Not now" on the agency screen recommendation and you should be directed to the next recommendation. Continue selecting "Not now" until you reach the summary page.
- Click the "Sign Up" external link next to the Jetpack for Agencies recommendation and make sure it opens (no need to fill out): https://cloud.jetpack.com/agency/signup
- Navigate back to `/wp-admin/admin.php?page=jetpack#/recommendations/site-type` and select both "I build or manage this site for a client" and "This is an e-commerce site" and click on Continue.
- You should see the Agencies recommendation first, select "Not now".
- Next you should see the WooCommerce recommendation.
- That is all for testing these updated recommendations.

**And to test the mobile app links:**

- Navigate to `/wp-admin/admin.php?page=jetpack#/recommendations/summary`
- On a desktop or laptop computer, a QR code for the Jetpack mobile app will be displayed next to the `jetpack.com/mobile` URL.
- When visiting the same recommendations page on a mobile device, the respective app store button should be shown for well known devices and mobile operating systems.
- If you don't have a mobile device to test with, you might try using Chrome to simulate the user agent:
  - Open the Chrome Dev Tools
  - Click the vertical menu option > More tools > Network conditions
  - In the Network conditions tab, uncheck the "Use browser default" for the user agent, and select an iOS or Android one for testing.
  - When refreshing the recommendations page you should see the expected mobile app store button.

**Thank you for all your help!**
