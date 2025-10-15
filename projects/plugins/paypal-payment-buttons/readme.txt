=== PayPal Payment Buttons ===
Contributors: paypal,automattic,woocommerce
Tags: paypal, payments, ecommerce, blocks, checkout
Requires at least: 6.7
Requires PHP: 7.2
Tested up to: 6.8
Stable tag: 0.3.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Easily showcase products/services, upload images, manage variants, set pricing options, and simplify checkout with shipping and taxes.

== Description ==

Start accepting PayPal payments from any post or page with the PayPal Payment Buttons block. Designed to streamline the checkout experience, PayPal Payment Buttons can help boost your conversion at the point of payment.

- **Fast, easy setup**: You can create PayPal Payment Buttons in seconds - no coding experience needed. Embed the buttons on your site in minutes. Just copy and paste 5 lines of code.
- **More payment options**: Let your customers choose how they want to pay. You can accept PayPal, Venmo, Pay Later, Apple Pay®, debit cards, and credit cards. Availability may vary by region.
- **Higher sales**: We help drive conversion by offering a trusted, seamless payment experience.
- **International reach**: We make it simple to accept payments from customers around the globe. Access PayPal’s coverage for over 200 countries and regions, supporting 24 currencies and 25 languages to support sales around the globe.
- **Smart security**: Get peace of mind with encryption and fraud prevention.

### Highlight Features

- Add images and descriptions to showcase your products and services.
- Easily add and manage product variants.
- Implement the Name Your Price feature for tipping or flexible price payments.
- Tailor your page and buttons to align with your personal brand.
- Offer a variety of shipping options and tax rates based on buyer's location.
- Easily track payments via your PayPal dashboard.

### Requirements

The PayPal Payment Buttons block is free to use. It is available as part of the Jetpack plugin. It is also available to all WordPress.com hosted sites. It is also available as a standalone plugin from the WordPress.org plugin directory.

Once you have added and set up the block, you’ll also need a free PayPal account linked to your bank account to claim any payments you receive.

You can add the PayPal Payment Buttons block in your post or page, by following these steps:

### Add a PayPal Payment Buttons block

1. Select the PayPal Payment Buttons block from the block picker. You can recognize the block by its green credit card icon.
2. [Sign up](https://www.paypal.com/bizsignup/entry?product=payment_button&utm_source=wp&at_code=wp) or [log in](https://www.paypal.com/ncp/buttons/create?utm_source=wp&at_code=wp) to PayPal to get your Payment Button code.
3. Choose between Stacked Buttons and Single Buttons based on your needs.
   - **Stacked Buttons (Recommended)**: This option lets you present all of your product information and PayPal payment method upfront on your website.
   - **Single Buttons**: This option lets you quickly paste a single button on your site, with no product information.
4. Copy the provided button code from the PayPal site.


#### If you are using the Stacked Buttons:

1. Select the HTML code language from the dropdown above your button code. 
2. Then paste the code for the `<head>` into the first text box in the PayPal Payment Buttons block. (We’ll take care of placing this code into your post or page `<head>` only once.)
3. Then paste the `<body>` code into the second text box in the PayPal Payment Buttons block.

#### If you are using the Single Button:

1. Click the Single Button option in the PayPal Payment Buttons block.
2. Copy the single button code from the PayPal site and paste it into the text area of the block.

By repeating the process above, you can add as many PayPal Payment Buttons blocks to your page as you like.

### Taking Payments with PayPal

1. When a visitor clicks a PayPal payment button, a new window will open to guide them through the PayPal checkout process.
2. Visitors can use an existing PayPal account or a credit or debit card to complete their purchase.
3. All payments are credited to the PayPal business account that was used to create the payment button code.

== Installation ==

1. Upload the PayPal Payment Buttons plugin to your WordPress site.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Add the PayPal Payment Buttons block to any post or page using the block editor.
4. Configure your PayPal account settings within the block to start accepting payments.

== Frequently Asked Questions ==

= Can I test with a sandbox account? =

It is possible to perform test payments with the PayPal Payment Buttons block. To get started you would need to create a [PayPal Developer account](https://developer.paypal.com/home/). Once you are logged into your PayPal developer account, you can access or create new sandbox accounts. You will need to make note of your sandbox business account and personal account email addresses and passwords. Once you have this information, you would login to the [PayPal Sandbox site](https://www.sandbox.paypal.com/) with the sandbox business account. Create a [payment button on the PayPal sandbox site](https://www.sandbox.paypal.com/ncp/buttons/create?utm_source=wp&at_code=wp). Follow the instructions above to add the payment button code to your PayPal Payment Buttons block. Publish the post or page that contains the block. Then use the sandbox personal account to complete the purchase. All successful test payments will show up in the business sandbox account on the PayPal Sandbox.

== Changelog ==
### 0.3.1 - 2025-10-09
#### Changed
- Update package dependencies.
- Update short description for plugin

