# Pay with PayPal — Jetpack Support Page

> **Target URL:** https://jetpack.com/support/pay-with-paypal
> **Owner:** Jetpack Docs team
> **Action:** Full rewrite — replaces paste-code workflow with API-driven credential wizard
> **Also mirrored to:** fork `projects/packages/paypal-payments/docs/support-pay-with-paypal.md`

---

## Pay with PayPal

The Pay with PayPal block lets you accept payments directly on your WordPress site. Create PayPal-branded Buy Now buttons and shareable payment links without leaving the block editor.

<!-- [VERIFY] Current plan requirement. Existing page says Growth, Security, or Complete plan. Confirm whether this is still accurate for v0.8.0. -->
**Requires:** Jetpack Growth, Security, or Complete plan

### How It Works

1. Connect your PayPal account using API credentials
2. Add the Pay with PayPal block to any post or page
3. Enter product details (name, price, currency)
4. Click "Create Button" — the plugin creates a payment link via PayPal's API
5. Publish — visitors see a styled PayPal button that links to checkout

Each button also generates a shareable payment link URL you can use in emails, social media, or text links.

### Setting Up PayPal

#### Step 1: Get API Credentials

1. Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/)
2. Navigate to **Apps & Credentials**
3. Select the **Live** tab for production credentials
4. Click **Create App** or select an existing app
5. Copy the **Client ID** and **Client Secret**

#### Step 2: Connect in the Block Editor

1. Add a **Pay with PayPal** block to any post or page
2. The setup wizard appears automatically:
   - **Welcome** — Click "Get Started"
   - **Dashboard** — Follow the link to the PayPal Developer Dashboard to get your credentials
   - **Credentials** — Paste your Client ID and Client Secret
3. The plugin validates your credentials with PayPal
4. Once connected, you'll see the product creation form

The plugin defaults to **Production** mode — you can accept real payments right away.

#### Testing with Sandbox

To test without processing real payments:

1. In the PayPal Developer Dashboard, select the **Sandbox** tab under Apps & Credentials
2. Create a Sandbox app and copy its Client ID and Client Secret
3. In the block editor credentials step, click **"Use Sandbox for testing"** at the bottom
4. Enter your Sandbox credentials

When you're ready for real payments, disconnect and reconnect with your Live (Production) credentials.

### Creating a Button

Once connected:

1. Enter a **Product Name** (max 127 characters)
2. Enter a **Price** (positive number, up to 2 decimal places)
3. Select a **Currency** from the dropdown (26 supported)
4. Optionally add a **Description** (max 256 characters)
5. Click **Create Button**

A live preview appears showing exactly how your button will look on the published page.

### Button Layouts

| Layout | Description |
|--------|-------------|
| Stacked | PayPal button + "Debit or Credit Card" secondary button |
| Single | PayPal button only |

### Editing and Deleting Buttons

- **Edit:** Click "Edit Button" in the block sidebar to update product details, then "Update Button" to save
- **Delete:** Click "Delete Button" to remove the PayPal resource and start over

### Legacy Buttons

Buttons created with the previous paste-code method continue to work. They show a "Legacy" label in the editor but render normally on your site. No migration is required — old buttons work alongside new API-created ones.

### Supported Currencies

USD, EUR, GBP, CAD, AUD, JPY, CHF, SEK, NOK, DKK, NZD, SGD, HKD, MXN, BRL, PLN, CZK, HUF, ILS, MYR, PHP, TWD, THB, INR, CNY, and RUB.

### Security

- Credentials are stored in your WordPress database with integrity protection
- OAuth tokens are cached and refresh automatically before expiry
- All payment links are validated against PayPal's domain whitelist
- Credential storage integrity is tied to your site's `wp-config.php` security keys

### Disconnecting

Disconnect PayPal from the block sidebar at any time. Your stored credentials and cached token are removed. Published payment buttons continue to work — the payment links are hosted by PayPal and don't depend on the plugin connection.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Client ID or Client Secret is incorrect" | Verify you're using credentials from the correct environment tab (Live vs. Sandbox) in the PayPal Developer Dashboard |
| "Not authorized for Payment Links & Buttons" | Your PayPal app needs the Payment Links & Buttons feature enabled. Check your app settings or create a new app |
| "Could not connect to PayPal" | Your hosting may block outgoing HTTPS requests. Ask your host to whitelist `api.paypal.com` |
| "PayPal is temporarily unavailable" | PayPal may be experiencing an outage. The plugin retries automatically — try again in a few minutes |
| Button preview shows but frontend doesn't render | Make sure you clicked "Update" or "Publish" after creating the button |

### Related

- [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/) — Manage your API credentials
- [Jetpack Features: Earn](https://jetpack.com/support/features-earn/) — Overview of Jetpack earning features
