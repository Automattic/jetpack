# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.5.0 - 2026-10-14
### Added
- Add a "Manage PayPal Payment Links" link to the block's PayPal Connection panel once the block has a saved link, so the admin page is one click away while editing. [#52273]
- Add an account menu to the top of the block settings sidebar, with links to PayPal's checkout settings and transactions, and a Log out showing the connected account. Part of the API-managed payment buttons, behind a feature flag that is not yet enabled. [#52509]
- Add API-managed payment buttons behind a feature flag that is not yet enabled. Once it is on, you can connect a PayPal account from WordPress, create and manage payment links without leaving the editor, choose a Button, Link, or QR format, and style it with your own colors, size and border. [#52210]
- Add a Product ID field, shipping fees, a handling fee and a discount, let tax be a flat amount as well as a percentage, check every fee against the decimal places its currency allows, hold a tax rate under 100% and to two decimal places, rework the customer note fields, keep the line breaks inside a product description, and match the Checkout Options controls to the design. Part of the API-managed payment buttons, behind a feature flag that is not yet enabled. [#52301]
- Add Change item to a saved payment link's menu in the block settings sidebar, to switch the button to another of the account's payment links. [#52534]
- Add stacked buttons as a display format for PayPal payment buttons. [#52512]
- Ask whether to save or discard unsaved changes when leaving a saved payment link's form in the block settings sidebar. [#52553]
- Give each link in the existing links list a menu to duplicate it into a new payment link or delete it, and let the new link's form go back to the list. [#52543]
- Link sellers to their PayPal transactions and to PayPal's refund instructions from the block's account menu and the Payment Links admin page. [#53091]
- Offer the account's existing payment links when a new block is added, so a block can reuse one instead of creating another. [#52329]
- Show a snackbar after a post save that creates or changes a PayPal payment link. [#52740]
- The editor canvas draws what the published block will look like, and each format gets its own settings in a new Styles tab: text and background colors with a contrast warning, a Fill or Outline style, text size, width, border, and a "Powered by PayPal" toggle. Buttons, links and QR codes each get the settings that apply to them. Part of the API-managed payment buttons, behind a feature flag that is not yet enabled. [#52210]
- Warn in the editor when the seller's PayPal email is unconfirmed, the account is restricted from receiving payments, or permissions the block needs are missing, and refuse new connections that lack those permissions. [#53113]

### Changed
- Connect with PayPal no longer stores API credentials on the site; PayPal calls for referred sellers are made through WordPress.com. [#52873]
- Create, update and delete the PayPal payment with the post instead of from a Create New button: the payment is written when the post is saved, and removed when the post is saved without its block and no other published post uses it. [#52224]
- General: Update minimum WordPress version to 7.0. [#49021] [#51370]
- Gray the preview button in the Create new form until the link is created. [#53572]
- Hide the PayPal sandbox option in the connection wizard behind a feature flag; the wizard connects to production only unless the flag is on. [#53403]
- Hide the Styles tab until the block has a payment link, and keep the existing links list in sync across blocks. [#52668]
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Label the admin menu item "PayPal Payment Links" instead of "Payment Links", so it is recognisable under the Jetpack menu. [#52270]
- Move the payment button's product form into the block settings sidebar, and label its primary button Create New or Save instead of repeating the display format. [#52022]
- Move the PayPal connection wizard into the block settings sidebar, with the block itself only saying a PayPal business account is needed. [#52334]
- Open a saved payment link on its details in the block settings sidebar, with the form behind Edit. The notice saying when changes reach PayPal is gone, and the warning that a link changed at PayPal also shows on the details view. [#52372]
- Remove unneeded development and documentation files from the published plugin. [#49014]
- Require an acknowledgement before a payment link is deleted, from the block and from the admin page, and document that PayPal cannot pause or restore a deleted link. [#52270]
- Show PayPal's debug ID in API error messages so failed requests can be traced with PayPal support. [#53021]
- Show the result of deleting a link, disconnecting, or picking an existing link in a snackbar. [#52464]
- Tested up to WordPress 7.1. [#48114] [#51370]
- Updated package dependencies. [#48735] [#48064] [#48106] [#48405] [#48683] [#49012] [#49218] [#49273] [#49448] [#49492] [#49631] [#49691] [#49757] [#49831] [#50097] [#50183] [#50436] [#50529] [#50751] [#51399] [#51701] [#52028] [#52187] [#52297] [#52999]
- Use PayPal's official logos, unmodified, and match the connect wizard to the design. [#53118]
- Use PayPal's prescribed wording in the disconnect and log out confirmations. [#53089]

### Removed
- Remove the product image field from the block editor form until PayPal payment links can carry an image; blocks that already hold one keep showing it. [#53405]
- Updated PHP version requirements to PHP 7.4 or newer. [#51515]

### Fixed
- Allow http return URLs, and show an error in the block when a return URL is invalid. [#52774]
- Allow product descriptions up to PayPal's real 2048-character limit, instead of cutting them off at 256. [#52172]
- Ask only about changes made since the last post save when leaving a saved payment link's form. [#52744]
- Break the PayPal disconnect confirmation into a short summary and a list, so its consequences are readable at a glance. [#51656]
- Close PayPal's onboarding window with the Escape key or its Close button, instead of reloading the editor and losing unsaved changes. [#51656]
- Close the PayPal onboarding popup automatically when it returns, instead of leaving it open on a wp-admin screen. [#51656]
- Collect the shipping address without a shipping fee, from a new "Shipping address" toggle. Tax or shipping from PayPal settings now shows an error until the address is on. [#53500]
- Complete PayPal onboarding using PayPal's own onboarding SDK, so connecting an account finishes instead of stopping at "Merchant integration info not available". [#51656]
- Connect a PayPal account in a separate window, so finishing onboarding no longer reloads the editor and discards an unsaved post. [#51656]
- Connection: Translate the Connectors card's text on sites that don't use English. [#53179]
- Discard a PayPal connection that fails its final checks, instead of leaving the site looking connected while reporting an error. [#51656]
- Encode the PayPal payment link in the QR code behind the button's Show Link or QR Code toggle, instead of the page the button sits on. [#51656]
- Fix "Connect with PayPal" always failing with "Request is not well-formed, syntactically incorrect, or violates schema." The seller nonce was 43 characters, one below the minimum PayPal enforces. [#51656]
- Fix "Connect with PayPal" failing its final checks. The setup request never asked PayPal for Payment Links & Buttons access, which every button needs. [#51656]
- Fix "Connect with PayPal" failing with a 404, and create the onboarding referral through WordPress.com so PayPal platform credentials never reach the site. [#51656]
- Fix an error from PayPal when product options have their own prices. The product price is now optional in that case, and every option in the group must be priced. [#51656]
- Fix editing a payment button reporting an error after the edit saved. PayPal answers a successful update with 204 No Content and the API client expected 200. [#52172]
- Fix onboarding leaving the site connected but reporting "Merchant integration info not available". The merchant ID PayPal returns on the redirect was never saved. [#51656]
- Fix tax collection turning itself off. An empty tax name made the block and then the REST route throw the whole tax away. [#52172]
- Fix Update deleting payment configuration set outside the block. An update is a full replacement at PayPal, so a SKU, shipping rate, handling fee or discount set anywhere else was silently dropped, and address collection was forced back on. [#52172]
- Go straight to the API credentials step on a site with no WordPress.com connection, instead of offering Connect with PayPal. [#51656]
- Include PayPal's own error and debug ID when Payment Links & Buttons access is refused, instead of guessing at the cause. [#51656]
- Include the PayPal partner attribution code in every copied and emailed payment link, matching the link the published button uses. [#51656]
- Keep keyboard focus on the PayPal onboarding overlay while it is open, return it to the Connect button on close, and hide Close once the seller has finished at PayPal. [#53151]
- Keep the PayPal connection error dismissed, instead of showing it again and asking PayPal for another onboarding link. [#51656]
- Let a seller connect the same PayPal account on more than one site without the earlier site losing access. [#53103]
- Load PayPal's onboarding script into the editor canvas so the Connect with PayPal button opens PayPal's window instead of a new browser tab. [#51656]
- Log a notice when stored PayPal credentials cannot be decrypted and are removed, instead of removing them silently. [#51656]
- Make a percentage Width the same size in the editor as on the published page, fit the QR code's link field and Copy Link button in narrow columns, and remove the connection status and Sandbox badge from the editor canvas. [#52773]
- Make the Copy Link button work in the payment button's QR code panel, where clicking it previously did nothing. [#51656]
- Make Width size the whole payment button, so the product and "Powered by PayPal" line up with it. [#52677]
- Mark the post as changed when a payment button is updated to match its link on PayPal, so the change can be saved and shown on the page. [#52553]
- Match the block's editor preview to the published button, and show "Powered by PayPal" by default. [#52671]
- Offer Connect with PayPal on WordPress.com and Jetpack-connected sites, instead of only after PayPal is already connected. [#51656]
- Open PayPal's onboarding window when you click Connect with PayPal, instead of covering the editor with a blank overlay. [#51656]
- Open PayPal onboarding in a sized window instead of a stray browser tab when PayPal's onboarding script is unavailable. [#51656]
- Removing a block no longer deletes its payment link from PayPal. The same link can be used by other posts, an email or a printed QR code, so it stays until it is deleted on purpose. [#52463]
- Report a PayPal platform configuration problem directly instead of asking the merchant to try again, which could never help. [#51656]
- Say how many published posts embed a payment link before it is deleted from the admin. [#51656]
- Say so when opening a post picks up changes made to the payment link elsewhere. The block used to take them silently, so a price or description edited in PayPal's dashboard, or by another block sharing the same link, changed under the merchant with nothing shown. Part of the API-managed payment buttons, behind a feature flag that is not yet enabled. [#52302]
- Send the "Open PayPal Dashboard" link to the sandbox app list when connecting in sandbox, instead of always opening the live one. [#51656]
- Show an error in the block when a return URL is over PayPal's 1024-character limit. [#52774]
- Show a payment link's hosted ID without its PLB- prefix in the block settings sidebar, so it no longer wraps. [#52550]
- Show that PayPal is disconnected instead of reporting a connected account, and offer a Reconnect button. Disconnecting now says it applies to the whole site. [#51656]
- Show the option price on the published page when the product options have their own prices. [#51656]
- Show the payment a duplicated block actually points at, so two blocks sharing one PayPal payment can no longer display different products or prices. [#51656]
- Show the PayPal Payment Links admin list and detail pages fresh after a link is created, edited, or deleted, instead of serving a cached copy for up to five minutes. [#52279]
- Spell "PayPal" with its own capitalization in the connect wizard headings and the wordmark's alt text. [#53090]
- Status: Detect a site served on any 127.0.0.0/8 loopback address, or on 0.0.0.0, as a local site. [#51311]
- Stop accepting prices with decimals for Japanese yen, Hungarian forint and New Taiwan dollar, which PayPal rejects, and remove the Indian rupee, which PayPal does not support. [#51656]
- Stop a save overwriting payment link settings before the block has loaded them, and keep a value edited while the link is still loading. [#52418]
- Stop collecting a shipping address once shipping is turned off, instead of keeping the hidden checkbox ticked. [#53092]
- Stop rendering a button for a payment link deleted through this site, warn in the editor that the link is gone before a save recreates it, and list the posts still embedding it after a delete from the admin page. [#52280]
- Stop the block retrying the PayPal onboarding link forever when the request fails. [#51656]
- Take the displayed price from the option group PayPal is actually pricing. [#51656]
- Tell the merchant when a payment link could not be loaded from PayPal, instead of silently showing stale details. [#53093]
- Tell the merchant when the browser blocks PayPal's onboarding window, instead of failing silently, and let the next Connect click open it. [#53152]
- The Send via Email card now shows the right price for links priced per option. Before, it showed just "$". [#52743]

## 0.4.0 - 2026-04-11
### Added
- IDC: Add revalidation for IDCs. [#46268]

### Changed
- Dependencies: Update lock file to keep root requirements in sync. [#47418]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Update dependencies. [#47472]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#46143] [#46456] [#46552] [#46647] [#46785] [#46854] [#47002] [#47021] [#47099] [#47173] [#47300] [#47371] [#47496] [#47505] [#47684] [#47799] [#47825] [#47890] [#47998]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]

### Fixed
- Admin Page: Restore border on header component. [#47425]
- PayPal Payments Button: Fix escaping issue for stacked payments buttons. [#47761]

## 0.3.2 - 2025-11-20
### Added
- Tested up to WordPress 6.9. [#45571]

### Changed
- Update package dependencies. [#45478] [#45676] [#45756] [#45915] [#45958]

### Fixed
- Jetpack: Remove getIconColor functions for block icons. [#45992]

## 0.3.1 - 2025-10-09
### Changed
- Update package dependencies. [#45173] [#45200] [#45229] [#45298] [#45299] [#45334]
- Update short description for plugin. [#45443]

## 0.3.0 - 2025-09-16
### Changed
- Improve robustness of PayPal Payment Buttons parsing [#45158]
- Remove admin page for PayPal Payment Buttons plugin. [#44712]
- Update package dependencies. [#44677] [#44701] [#44725] [#45027] [#45096]
- Update readme.txt and adds assets for distribution. [#44584]

## 0.2.0 - 2025-07-25
### Added
- Initial release setup and plugin structure. [#44479]
- Integration with paypal-payments package for core functionality. [#44479]
- Working PayPal Payment Button block with availability data. [#44479]
