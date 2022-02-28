## 10.7

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### My Jetpack

This release contains the first iteration of My Jetpack, the new dashboard for managing standalone Jetpack plugins on the site. There's a lot to test here!

For Jetpack, start on a free plan and go to Dashboard > Jetpack > My Dashboard. From there:

- Check the various links
- Attempt to activate features and install additional standalone plugins.
- Check styling on desktop and mobile.
- Make sure Conntion links work.


### Color, Spacing, and Alignment Options for Various Blocks

Color, spacing, and alignment options were added for the following blocks:

- Form 
- Mailchimp
- Podcast Player
- Related Posts

Color and spacing options were added for:

- Business Hours

Alignment options were also added to:

- Repeat Visitor blocks

We can check and make sure those new features work as expected by adding them to posts and block widget areas and playing around with color, spacing and alignment.

### At-a-glance Partner Coupon Redemption CTA

We've introduced a new CTA to redeem a coupon that may have been provided by a partner at the top of the At-a-glance page.

- Make sure Jetpack is activated but not connected.
- Visit `/wp-admin/?jetpack-partner-coupon=PARTNER_COUPON_CODE` to store a partner coupon code. Please reach out to team Avalon to get a coupon code.
- Confirm you are redirected to `/wp-admin/admin.php?page=jetpack&showCouponRedemption=1#/` which matches screenshot 1 below.
- For every step, make sure that the Redeem button redirects you to checkout with your partner coupon applied. The "Set up & redeem" buttons should first connect you and then redirect you to checkout instead.
- Establish a site connection by bailing out of the connection flow before approving the connection to your account.
- Go to Jetpack Dashboard and confirm it matches screenshot 2 below.
- Establish a user connection.
- Go to Jetpack Dashboard and confirm it matches screenshot 3 below.
- Go to Jetpack Dashboard, add `&showCouponRedemption=1` to your URL and confirm it matches screenshot 4 below.

Screenshot 1) No connection with and without showCouponRedemption=1:
![Screen Shot 2022-01-20 at 19 28 40](https://user-images.githubusercontent.com/22746396/150391173-39ae5381-a9ce-4fb4-ae70-954a3d28266e.png)

Screenshot 2) Site connection with and without showCouponRedemption=1:
![Screen Shot 2022-01-20 at 19 29 41](https://user-images.githubusercontent.com/22746396/150391194-e9ce9d7d-a93c-4a4e-9e26-e631c0406517.png)

Screenshot 3) User connection without showCouponRedemption=1:
![Screen Shot 2022-02-08 at 21 43 14](https://user-images.githubusercontent.com/22746396/153063496-80f4423d-d9d3-456c-a19e-c2c3bb108163.png)

Screenshot 4) User connection and showCouponRedemption=1:
![Screen Shot 2022-02-08 at 21 43 41](https://user-images.githubusercontent.com/22746396/153063516-8d121e0a-0fb1-4a71-b296-5339965393f7.png)

### At-a-glance Partner Coupon Redemption Backup Banner

We've introduced a new callout to redeem a coupon that may have been provided by a partner replacing the Backup upgrade banner.

- Make sure Jetpack is activated and connected, has Jetpack Free as its plan, and has no other products.
- Visit `/wp-admin/admin.php?page=jetpack#/dashboard` and confirm the Backup feature section shows what is visible in screenshot 1 below.
- Visit `/wp-admin/?jetpack-partner-coupon=PARTNER_COUPON_CODE` to store a partner coupon code. Please reach out to team Avalon to get a coupon code.
- Visit `/wp-admin/admin.php?page=jetpack#/dashboard` and confirm the Backup feature section shows what is visible in screenshot 2 below. Clicking on the Redeem button should redirect you to checkout with your partner coupon applied.
- Purchase a product to your test site that provides backups.
- Visit `/wp-admin/admin.php?page=jetpack#/dashboard` and confirm the Backup feature section shows what is visible in screenshot 3 below.

Screenshot 1) No backup product, no partner coupon:

![Screen Shot 2022-02-01 at 19 08 35](https://user-images.githubusercontent.com/22746396/152016113-1da5365c-3f54-40c9-b079-47e97767bd40.png)

Screenshot 2) No backup product, partner coupon available:

![Screen Shot 2022-02-01 at 19 03 52](https://user-images.githubusercontent.com/22746396/152016107-bf474b8b-2970-44f5-b11a-b5f997bb613c.png)

Screenshot 3) Backup product active, partner coupon status is irrelevant:

![Screen Shot 2022-02-01 at 18 57 18](https://user-images.githubusercontent.com/22746396/152016100-6fe4a8f5-4ac4-482e-9501-8ed7f216f592.png)

**Thank you for all your help!**
