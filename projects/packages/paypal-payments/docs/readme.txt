=== PayPal Payment Buttons ===
Contributors: paypal,automattic,woocommerce
Tags: paypal, payments, buy now, payment buttons, payment links, ecommerce
Requires at least: 6.8
Requires PHP: 7.4
Tested up to: 6.9
Stable tag: 0.8.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Accept payments with PayPal — create theme-native Buy Now buttons and shareable payment links directly in the WordPress block editor.

== Description ==

PayPal Payment Buttons lets you accept payments on your WordPress site using PayPal's Pay Links & Buttons API. Create theme-native Buy Now buttons — and shareable payment links — without leaving the block editor. Buttons inherit your active theme's styles using the `wp-element-button` CSS class, with "Powered by PayPal" attribution displayed below. Every payment resource you create includes both an embeddable button and a direct PayPal-hosted payment URL you can share or embed anywhere.

**Key Features:**

* **API-driven button and link creation** — Fill in product name, price, and currency; the plugin creates a PayPal payment resource automatically — giving you both an embeddable button and a shareable payment link
* **Theme-native buttons** — A single "Buy Now" button that inherits your active theme's styles (wp-element-button class), with "Powered by PayPal" attribution below
* **Live preview** — See exactly how your button will look before publishing — the frontend renders identically to the editor preview
* **25 currencies supported** — USD, EUR, GBP, JPY, and 21 more with proper currency symbol formatting
* **Secure credential storage** — OAuth credentials are encrypted at rest using authenticated encryption (libsodium)
* **Backward compatible** — Existing paste-code buttons continue to work unchanged

**How It Works:**

1. Connect your PayPal account using API credentials from the PayPal Developer Dashboard
2. Add the PayPal Payment Buttons block to any post or page
3. Enter your product details (name, price, currency, and optional description)
4. Click "Create Button" — the plugin creates a payment link via PayPal's API
5. Publish your post — visitors see a theme-native "Buy Now" button with "Powered by PayPal" attribution that links to checkout. The payment link URL is also available to share directly or embed in text links.

== Installation ==

1. Upload the plugin to the `/wp-content/plugins/` directory, or install via the WordPress plugin screen.
2. Activate the plugin through the "Plugins" screen in WordPress.
3. **Connect PayPal:**
   a. Go to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/).
   b. Create a new app (or use an existing one) under **Apps & Credentials**. Select **Live** for your production app.
   c. Copy the **Client ID** and **Client Secret** from your Live app.
   d. Add a PayPal Payment Buttons block in the editor. Click **Connect PayPal** and paste your Client ID and Client Secret.
   e. The plugin defaults to **Production** mode — you're ready to accept real payments. To test first, create a separate **Sandbox** app in the PayPal Developer Dashboard (under **Apps & Credentials** → **Sandbox** tab) and toggle **Sandbox** mode in the block editor sidebar.

= Requirements =

* WordPress 6.8 or later
* PHP 7.4 or later with the Sodium extension (included by default in PHP 7.2+)
* A PayPal Business or Developer account with API credentials

== Frequently Asked Questions ==

= How do I get PayPal API credentials? =

1. Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/).
2. Navigate to **Apps & Credentials**.
3. Select **Sandbox** or **Live** depending on your needs.
4. Click **Create App** or select an existing app.
5. Copy the **Client ID** and **Client Secret**.

= What's the difference between Sandbox and Production? =

**Production** is the live environment where real customers make real purchases — this is the default. **Sandbox** is PayPal's testing environment where no real money changes hands. To test in Sandbox, create a separate Sandbox app in the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/) and toggle Sandbox mode in the block editor sidebar. Switch back to Production with your live credentials when you're ready to accept payments.

= Will my existing PayPal buttons still work after updating? =

Yes. Existing buttons created with the paste-code method continue to work exactly as before. There is no forced migration — old buttons render unchanged on both the editor and frontend.

= What currencies are supported? =

USD, EUR, GBP, CAD, AUD, JPY, CHF, SEK, NOK, DKK, NZD, SGD, HKD, MXN, BRL, PLN, CZK, HUF, ILS, MYR, PHP, TWD, THB, INR, and CNY. Each currency displays its proper symbol (e.g., $, €, £, ¥) on both the editor preview and published page.

= Where are my PayPal credentials stored? =

Credentials are encrypted at rest in the WordPress database (`wp_options`) using libsodium authenticated encryption, with a key derived from your site's `AUTH_KEY` constant. An integrity check prevents tampering. Changing your security keys in `wp-config.php` (for example, during a site migration) will invalidate stored credentials and require reconnecting PayPal.

= What happens if I disconnect PayPal? =

Disconnecting removes your stored credentials and cached token. Existing published buttons continue to work on the frontend — the payment links are static URLs hosted by PayPal and do not depend on the plugin being connected. However, you won't be able to create new buttons or edit existing ones until you reconnect.

= I'm seeing "not authorized for Payment Links & Buttons" — what do I do? =

This means your PayPal app may not have the required permissions. In the PayPal Developer Dashboard, ensure your app has the **Payment Links & Buttons** feature enabled. If you're using a sandbox account, create a new sandbox business account with full permissions.

= Can I use this with WooCommerce? =

This plugin is designed for standalone PayPal payment buttons on posts and pages. It's separate from the WooCommerce PayPal payment gateway. Both can coexist on the same site.

== Changelog ==

= 0.8.0 =
* **New:** API-driven button and payment link creation via PayPal's Pay Links & Buttons API — every payment resource includes both an embeddable button and a shareable payment URL
* **New:** OAuth 2.0 connection flow with encrypted credential storage (libsodium authenticated encryption)
* **New:** Live button preview in the block editor with theme-native styling
* **New:** Frontend rendering matches block editor preview exactly — currency symbols, product info card, "Powered by PayPal" attribution
* **New:** Product description field with truncation on the published page
* **New:** Edit/preview mode toggle for existing buttons
* **New:** Client-side and server-side input validation
* **New:** Automatic token refresh on expiry with retry logic
* **New:** Exponential backoff for transient API errors (500/502/503)
* **New:** PayPal URL domain whitelist for payment link validation
* **New:** 25 supported currencies with proper symbol formatting
* **New:** Delete button action in the sidebar
* **Fixed:** Extract payment_link from HATEOAS links array instead of non-existent top-level field
* **Fixed:** Align block.json attribute names between editor (JS) and server-side (PHP) registration
* **Fixed:** Frontend style.css build path (was incorrectly pointing to editor.css)
* **Improved:** User-friendly error messages for all PayPal API errors
* **Improved:** Backward compatibility with v0.4.0-alpha paste-code blocks via deprecated.js

= 0.3.2 - 2025-11-20 =
* Tested up to WordPress 6.9.
* Update package dependencies.
* Jetpack: Remove getIconColor functions for block icons.

= 0.3.1 - 2025-10-09 =
* Update package dependencies.
* Update short description for plugin.

= 0.3.0 - 2025-09-16 =
* Improve robustness of PayPal Payment Buttons parsing.
* Remove admin page for PayPal Payment Buttons plugin.
* Update readme.txt and adds assets for distribution.

= 0.2.0 - 2025-07-25 =
* Initial release setup and plugin structure.
* Integration with paypal-payments package for core functionality.
* Working PayPal Payment Button block with availability data.

== Upgrade Notice ==

= 0.8.0 =
Major update: API-driven PayPal button creation replaces the paste-code workflow. Existing buttons are fully backward compatible — no action required.

== Screenshots ==

1. Connect PayPal — Enter API credentials from the PayPal Developer Dashboard.
2. Create Button — Fill in product name, price, and currency in the block editor.
3. Live Preview — See the theme-native "Buy Now" button preview before publishing.
4. Frontend — Published "Buy Now" button with product info, "Powered by PayPal" attribution, and payment link.
