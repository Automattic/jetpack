=== PayPal Payment Buttons ===
Contributors: paypal,automattic,woocommerce
Tags: paypal, payments, buy now, payment buttons, ecommerce
Requires at least: 7.0
Requires PHP: 7.4
Tested up to: 7.1
Stable tag: 0.5.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

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
### 0.5.0 - 2026-10-14
#### Added
- Add a "Manage PayPal Payment Links" link to the block's PayPal Connection panel once the block has a saved link, so the admin page is one click away while editing.
- Add an account menu to the top of the block settings sidebar, with links to PayPal's checkout settings and transactions, and a Log out showing the connected account. Part of the API-managed payment buttons, behind a feature flag that is not yet enabled.
- Add API-managed payment buttons behind a feature flag that is not yet enabled. Once it is on, you can connect a PayPal account from WordPress, create and manage payment links without leaving the editor, choose a Button, Link, or QR format, and style it with your own colors, size and border.
- Add a Product ID field, shipping fees, a handling fee and a discount, let tax be a flat amount as well as a percentage, check every fee against the decimal places its currency allows, hold a tax rate under 100% and to two decimal places, rework the customer note fields, keep the line breaks inside a product description, and match the Checkout Options controls to the design. Part of the API-managed payment buttons, behind a feature flag that is not yet enabled.
- Add Change item to a saved payment link's menu in the block settings sidebar, to switch the button to another of the account's payment links.
- Add stacked buttons as a display format for PayPal payment buttons.
- Ask whether to save or discard unsaved changes when leaving a saved payment link's form in the block settings sidebar.
- Give each link in the existing links list a menu to duplicate it into a new payment link or delete it, and let the new link's form go back to the list.
- Link sellers to their PayPal transactions and to PayPal's refund instructions from the block's account menu and the Payment Links admin page.
- Offer the account's existing payment links when a new block is added, so a block can reuse one instead of creating another.
- Show a snackbar after a post save that creates or changes a PayPal payment link.
- The editor canvas draws what the published block will look like, and each format gets its own settings in a new Styles tab: text and background colors with a contrast warning, a Fill or Outline style, text size, width, border, and a "Powered by PayPal" toggle. Buttons, links and QR codes each get the settings that apply to them. Part of the API-managed payment buttons, behind a feature flag that is not yet enabled.
- Warn in the editor when the seller's PayPal email is unconfirmed, the account is restricted from receiving payments, or permissions the block needs are missing, and refuse new connections that lack those permissions.

#### Changed
- Connect with PayPal no longer stores API credentials on the site; PayPal calls for referred sellers are made through WordPress.com.
- Create, update and delete the PayPal payment with the post instead of from a Create New button: the payment is written when the post is saved, and removed when the post is saved without its block and no other published post uses it.
- General: Update minimum WordPress version to 7.0.
- Gray the preview button in the Create new form until the link is created.
- Hide the PayPal sandbox option in the connection wizard behind a feature flag; the wizard connects to production only unless the flag is on.
- Hide the Styles tab until the block has a payment link, and keep the existing links list in sync across blocks.
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency.
- Label the admin menu item "PayPal Payment Links" instead of "Payment Links", so it is recognisable under the Jetpack menu.
- Move the payment button's product form into the block settings sidebar, and label its primary button Create New or Save instead of repeating the display format.
- Move the PayPal connection wizard into the block settings sidebar, with the block itself only saying a PayPal business account is needed.
- Open a saved payment link on its details in the block settings sidebar, with the form behind Edit. The notice saying when changes reach PayPal is gone, and the warning that a link changed at PayPal also shows on the details view.
- Remove unneeded development and documentation files from the published plugin.
- Require an acknowledgement before a payment link is deleted, from the block and from the admin page, and document that PayPal cannot pause or restore a deleted link.
- Show PayPal's debug ID in API error messages so failed requests can be traced with PayPal support.
- Show the result of deleting a link, disconnecting, or picking an existing link in a snackbar.
- Tested up to WordPress 7.1.
- Updated package dependencies.
- Use PayPal's official logos, unmodified, and match the connect wizard to the design.
- Use PayPal's prescribed wording in the disconnect and log out confirmations.

#### Removed
- Remove the product image field from the block editor form until PayPal payment links can carry an image; blocks that already hold one keep showing it.
- Updated PHP version requirements to PHP 7.4 or newer.

#### Fixed
- Allow http return URLs, and show an error in the block when a return URL is invalid.
- Allow product descriptions up to PayPal's real 2048-character limit, instead of cutting them off at 256.
- Ask only about changes made since the last post save when leaving a saved payment link's form.
- Break the PayPal disconnect confirmation into a short summary and a list, so its consequences are readable at a glance.
- Close PayPal's onboarding window with the Escape key or its Close button, instead of reloading the editor and losing unsaved changes.
- Close the PayPal onboarding popup automatically when it returns, instead of leaving it open on a wp-admin screen.
- Collect the shipping address without a shipping fee, from a new "Shipping address" toggle. Tax or shipping from PayPal settings now shows an error until the address is on.
- Complete PayPal onboarding using PayPal's own onboarding SDK, so connecting an account finishes instead of stopping at "Merchant integration info not available".
- Connect a PayPal account in a separate window, so finishing onboarding no longer reloads the editor and discards an unsaved post.
- Connection: Translate the Connectors card's text on sites that don't use English.
- Discard a PayPal connection that fails its final checks, instead of leaving the site looking connected while reporting an error.
- Encode the PayPal payment link in the QR code behind the button's Show Link or QR Code toggle, instead of the page the button sits on.
- Fix "Connect with PayPal" always failing with "Request is not well-formed, syntactically incorrect, or violates schema." The seller nonce was 43 characters, one below the minimum PayPal enforces.
- Fix "Connect with PayPal" failing its final checks. The setup request never asked PayPal for Payment Links & Buttons access, which every button needs.
- Fix "Connect with PayPal" failing with a 404, and create the onboarding referral through WordPress.com so PayPal platform credentials never reach the site.
- Fix an error from PayPal when product options have their own prices. The product price is now optional in that case, and every option in the group must be priced.
- Fix editing a payment button reporting an error after the edit saved. PayPal answers a successful update with 204 No Content and the API client expected 200.
- Fix onboarding leaving the site connected but reporting "Merchant integration info not available". The merchant ID PayPal returns on the redirect was never saved.
- Fix tax collection turning itself off. An empty tax name made the block and then the REST route throw the whole tax away.
- Fix Update deleting payment configuration set outside the block. An update is a full replacement at PayPal, so a SKU, shipping rate, handling fee or discount set anywhere else was silently dropped, and address collection was forced back on.
- Go straight to the API credentials step on a site with no WordPress.com connection, instead of offering Connect with PayPal.
- Include PayPal's own error and debug ID when Payment Links & Buttons access is refused, instead of guessing at the cause.
- Include the PayPal partner attribution code in every copied and emailed payment link, matching the link the published button uses.
- Keep keyboard focus on the PayPal onboarding overlay while it is open, return it to the Connect button on close, and hide Close once the seller has finished at PayPal.
- Keep the PayPal connection error dismissed, instead of showing it again and asking PayPal for another onboarding link.
- Let a seller connect the same PayPal account on more than one site without the earlier site losing access.
- Load PayPal's onboarding script into the editor canvas so the Connect with PayPal button opens PayPal's window instead of a new browser tab.
- Log a notice when stored PayPal credentials cannot be decrypted and are removed, instead of removing them silently.
- Make a percentage Width the same size in the editor as on the published page, fit the QR code's link field and Copy Link button in narrow columns, and remove the connection status and Sandbox badge from the editor canvas.
- Make the Copy Link button work in the payment button's QR code panel, where clicking it previously did nothing.
- Make Width size the whole payment button, so the product and "Powered by PayPal" line up with it.
- Mark the post as changed when a payment button is updated to match its link on PayPal, so the change can be saved and shown on the page.
- Match the block's editor preview to the published button, and show "Powered by PayPal" by default.
- Offer Connect with PayPal on WordPress.com and Jetpack-connected sites, instead of only after PayPal is already connected.
- Open PayPal's onboarding window when you click Connect with PayPal, instead of covering the editor with a blank overlay.
- Open PayPal onboarding in a sized window instead of a stray browser tab when PayPal's onboarding script is unavailable.
- Removing a block no longer deletes its payment link from PayPal. The same link can be used by other posts, an email or a printed QR code, so it stays until it is deleted on purpose.
- Report a PayPal platform configuration problem directly instead of asking the merchant to try again, which could never help.
- Say how many published posts embed a payment link before it is deleted from the admin.
- Say so when opening a post picks up changes made to the payment link elsewhere. The block used to take them silently, so a price or description edited in PayPal's dashboard, or by another block sharing the same link, changed under the merchant with nothing shown. Part of the API-managed payment buttons, behind a feature flag that is not yet enabled.
- Send the "Open PayPal Dashboard" link to the sandbox app list when connecting in sandbox, instead of always opening the live one.
- Show an error in the block when a return URL is over PayPal's 1024-character limit.
- Show a payment link's hosted ID without its PLB- prefix in the block settings sidebar, so it no longer wraps.
- Show that PayPal is disconnected instead of reporting a connected account, and offer a Reconnect button. Disconnecting now says it applies to the whole site.
- Show the option price on the published page when the product options have their own prices.
- Show the payment a duplicated block actually points at, so two blocks sharing one PayPal payment can no longer display different products or prices.
- Show the PayPal Payment Links admin list and detail pages fresh after a link is created, edited, or deleted, instead of serving a cached copy for up to five minutes.
- Spell "PayPal" with its own capitalization in the connect wizard headings and the wordmark's alt text.
- Status: Detect a site served on any 127.0.0.0/8 loopback address, or on 0.0.0.0, as a local site.
- Stop accepting prices with decimals for Japanese yen, Hungarian forint and New Taiwan dollar, which PayPal rejects, and remove the Indian rupee, which PayPal does not support.
- Stop a save overwriting payment link settings before the block has loaded them, and keep a value edited while the link is still loading.
- Stop collecting a shipping address once shipping is turned off, instead of keeping the hidden checkbox ticked.
- Stop rendering a button for a payment link deleted through this site, warn in the editor that the link is gone before a save recreates it, and list the posts still embedding it after a delete from the admin page.
- Stop the block retrying the PayPal onboarding link forever when the request fails.
- Take the displayed price from the option group PayPal is actually pricing.
- Tell the merchant when a payment link could not be loaded from PayPal, instead of silently showing stale details.
- Tell the merchant when the browser blocks PayPal's onboarding window, instead of failing silently, and let the next Connect click open it.
- The Send via Email card now shows the right price for links priced per option. Before, it showed just "$".

