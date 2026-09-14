# PayPal Payment Buttons — Troubleshooting Guide

Support documentation for common issues with the PayPal Payment Buttons plugin.

---

## Connection Issues

### "The Client ID or Client Secret is incorrect"

**Cause:** The credentials entered don't match a valid PayPal app.

**Steps to fix:**
1. Go to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/)
2. Select the correct environment tab (**Sandbox** or **Live**) — this must match what you chose in the plugin
3. Click on your app name
4. Copy the **Client ID** and **Client Secret** exactly (no extra spaces)
5. Re-enter them in the block editor

**Common mistakes:**
- Using Sandbox credentials with Production environment (or vice versa)
- Copying the App Name instead of the Client ID
- Extra whitespace at the beginning or end of the credentials

### "Failed to store PayPal credentials"

**Cause:** The PHP OpenSSL extension is not available.

**Steps to fix:**
1. Contact your hosting provider to enable the PHP `openssl` extension
2. Alternatively, check your `php.ini` file for `extension=openssl`
3. Restart PHP/web server after changes

### "Could not connect to PayPal"

**Cause:** Network connectivity issue between your server and PayPal's API.

**Steps to fix:**
1. By default, this plugin uses the **Production API** (`api.paypal.com`). Ensure your server can reach `api.paypal.com` over HTTPS. If you've explicitly enabled Sandbox mode, also whitelist `api-m.sandbox.paypal.com`.
2. Some hosting providers block outgoing HTTPS requests — contact your host to whitelist PayPal domains
3. If using a firewall or security plugin, ensure it's not blocking outgoing API calls
4. Try again in a few minutes — PayPal may be experiencing temporary issues

---

## Button Creation Issues

### "Your PayPal account is not authorized for Payment Links & Buttons"

**Cause:** The PayPal app doesn't have the Payment Links & Buttons feature enabled.

**Steps to fix:**
1. Log in to the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/)
2. Select your app
3. Look for **Payment Links & Buttons** under app features
4. If not available, you may need to:
   - Create a new app with the correct permissions
   - Contact PayPal support to enable this feature for your account
   - Ensure your PayPal account is a Business account (not Personal)

### "Product name is required" / "Price must be a positive number"

**Cause:** Client-side validation caught missing or invalid input.

**Steps to fix:**
- Product name: Enter a non-empty name (max 127 characters)
- Price: Enter a positive number with at most 2 decimal places (e.g., `29.99`)
- Currency: Select from the dropdown (26 currencies supported)

### "PayPal could not process your request"

**Cause:** PayPal's server rejected the request due to a business rule violation.

**Common causes:**
- Amount too low (some currencies have minimum amounts)
- Unsupported currency/amount combination
- Account-level restrictions

**Steps to fix:**
1. Try a different price or currency
2. Check your PayPal account for any restrictions or holds
3. If using Sandbox, create a fresh sandbox business account

### Button preview shows but frontend doesn't render

**Cause:** The post may not have been saved/published after creating the button, or the payment link was not extracted correctly from the API response.

**Steps to fix:**
1. After creating a button, make sure to **Update** or **Publish** the post
2. Check that the block is not in an error state (red border)
3. View the page source to confirm the payment link URL is present in an `<a>` tag
4. If the link is missing, try deleting the block and creating a new button — the HATEOAS link extraction fix in v0.8.0 resolves most cases

### Frontend button looks different from the editor preview

**Cause:** In versions prior to v0.8.0, the PHP renderer used different markup and classes than the React editor preview.

**Steps to fix:**
1. Update to the latest version — v0.8.0 aligns the PHP frontend rendering with the editor preview
2. Clear any page caches (plugin, CDN, or browser cache)
3. Verify that `style.css` is loading on the frontend (check page source for `paypal-payment-buttons/style.css`)

---

## Existing Button Issues

### "This PayPal button no longer exists"

**Cause:** The button was deleted from PayPal's side (via the PayPal dashboard or API), but the block still references it.

**Steps to fix:**
1. The plugin will automatically clear the stale reference
2. You'll be returned to the creation form — fill in the details and create a new button
3. Update/publish the post to save the new button

### Legacy paste-code button shows "legacy paste-code format"

**Cause:** This is expected behavior. Buttons created with the v0.4.0-alpha paste-code workflow display a read-only indicator in the editor.

**What to know:**
- The button continues to work on the frontend — no action needed
- You cannot edit legacy buttons with the new form UI
- To create a new API-managed button, add a new PayPal Payment Buttons block
- Legacy buttons are never auto-migrated

### Editor shows "This block contains unexpected or invalid content"

**Cause:** The block's saved HTML doesn't match any known version. This can happen if:
- The plugin was downgraded after creating V2 buttons
- The block HTML was manually edited

**Steps to fix:**
1. Click **Attempt Block Recovery** — WordPress will try to match a deprecated version
2. If recovery fails, click **Convert to HTML** and re-add a new PayPal Payment Buttons block
3. Re-enter your product details and create a new button

---

## API Error Reference

| Error Message | What It Means | What To Do |
|---------------|---------------|------------|
| "PayPal authentication expired" | OAuth token expired mid-session | Try the action again — token refreshes automatically |
| "PayPal is temporarily unavailable" | PayPal API server error | Wait a few minutes and retry — the plugin retries automatically up to 3 times |
| "Too many requests" | Rate limit hit | Wait 30-60 seconds before trying again |
| "The request to PayPal timed out" | Network timeout | Check your server's internet connectivity; retry |
| "PayPal returned a payment link from an untrusted domain" | Security check failed | Contact support — this indicates an unexpected API response |

---

## Environment & Configuration

### Switching Environments

The plugin defaults to **Production**. If you've been testing in Sandbox and are ready to go live, or need to switch between environments for any reason:

1. In the block editor, open the sidebar (**Settings** panel)
2. Under **PayPal Connection**, note the current environment
3. Disconnect the current connection (this clears the stored credentials and token — your existing published buttons continue to work, as their payment links are static PayPal URLs)
4. Reconnect using credentials for the target environment — **Production** (Live) or **Sandbox** credentials from the [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/)
5. Recreate any buttons you need — payment resources from one environment don't work in the other

### Credential Storage

- Credentials are stored in `wp_options` with integrity protection via `wp_hash()`
- Integrity key is derived from `LOGGED_IN_KEY` + `LOGGED_IN_SALT` in `wp-config.php`
- Changing these constants will invalidate stored credentials (you'll need to reconnect)
- OAuth tokens are cached as WordPress transients with expiration also stored in `wp_options` as a fallback for object cache flushes. Tokens auto-refresh 5 minutes before expiry

### Uninstalling

Disconnecting PayPal removes:
- Stored encrypted credentials
- Cached OAuth token
- Environment setting

Published payment links continue to work — they're static PayPal URLs that don't depend on the plugin.
