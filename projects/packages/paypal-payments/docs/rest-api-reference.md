# PayPal Payment Buttons — REST API Reference

Developer documentation for the WordPress REST API endpoints provided by the PayPal Payment Buttons plugin.

All endpoints require `manage_options` capability (WordPress administrator).

**Namespace:** `jetpack/v4`
**Base path:** `/paypal`

---

## Connection Management

### POST `/jetpack/v4/paypal/connect`

Store PayPal OAuth credentials and validate via token exchange.

**Request:**

```json
{
  "client_id": "AaBbCcDd...",
  "client_secret": "EeFfGgHh...",
  "environment": "production"
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `client_id` | string | Yes | — | PayPal OAuth client ID |
| `client_secret` | string | Yes | — | PayPal OAuth client secret |
| `environment` | string | No | `production` | `sandbox` or `production` |

**Response (200):**

```json
{
  "connected": true,
  "environment": "production",
  "message": "PayPal account connected successfully."
}
```

**Error (401):**

```json
{
  "code": "paypal_credentials_invalid",
  "message": "The Client ID or Client Secret is incorrect.",
  "data": { "status": 401 }
}
```

---

### GET `/jetpack/v4/paypal/connection`

Check current PayPal connection status.

**Response (200):**

```json
{
  "connected": true,
  "environment": "production"
}
```

---

### POST `/jetpack/v4/paypal/disconnect`

Remove stored credentials and cached token.

**Response (200):**

```json
{
  "connected": false,
  "message": "PayPal account disconnected."
}
```

---

### POST `/jetpack/v4/paypal/environment`

Switch between sandbox and production.

**Request:**

```json
{
  "environment": "production"
}
```

**Response (200):**

```json
{
  "environment": "production",
  "message": "PayPal environment set to production. Cached token has been cleared."
}
```

---

## Button & Link CRUD (Payment Resources)

Each payment resource created via these endpoints provides both an embeddable button and a direct `payment_link` URL. You can display the button using the block, or use the `payment_link` directly in text links, emails, or any other context.

### POST `/jetpack/v4/paypal/buttons`

Create a payment resource via the PayPal API. Returns both a button-ready resource ID and a shareable `payment_link` URL.

**Request:**

```json
{
  "type": "BUY_NOW",
  "integration_mode": "LINK",
  "reusable": "MULTIPLE",
  "line_items": [
    {
      "name": "Premium Widget",
      "description": "A high-quality widget",
      "unit_amount": {
        "currency_code": "USD",
        "value": "29.99"
      }
    }
  ],
  "return_url": "https://example.com/thank-you"
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | `BUY_NOW` | Payment type (only `BUY_NOW` in Phase 1) |
| `integration_mode` | string | No | `LINK` | `LINK` or `BUTTON` |
| `reusable` | string | No | `MULTIPLE` | `MULTIPLE` or `SINGLE` |
| `line_items` | array | Yes | — | Array of line item objects (min 1) |
| `line_items[].name` | string | Yes | — | Product name (max 127 chars) |
| `line_items[].description` | string | No | — | Product description (max 256 chars) |
| `line_items[].unit_amount.currency_code` | string | Yes | — | ISO currency code |
| `line_items[].unit_amount.value` | string | Yes | — | Price (positive, max 2 decimals) |
| `line_items[].quantity` | string | No | `1` | Quantity |
| `line_items[].image_url` | string | No | — | Product image URL |
| `return_url` | string | No | — | Post-payment redirect URL |
| `name` | string | No | — | Display name for the resource |

**Response (201):**

```json
{
  "id": "PLB-ABC123DEF456",
  "type": "BUY_NOW",
  "integration_mode": "LINK",
  "status": "ACTIVE",
  "payment_link": "https://www.paypal.com/ncp/payment/ABC123DEF456",
  "line_items": [ ... ]
}
```

> **Note:** PayPal's raw API returns the payment URL inside a HATEOAS `links` array
> (`{ "rel": "payment_link", "href": "..." }`), not as a top-level field. The WordPress
> REST endpoint extracts it automatically so consumers always receive a flat `payment_link` string.

---

### GET `/jetpack/v4/paypal/buttons`

List payment resources with pagination.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page_size` | integer | No | `10` | Results per page (1–100) |
| `page_token` | string | No | — | Pagination cursor |

**Response (200):**

```json
{
  "items": [ ... ],
  "total_items": 5
}
```

---

### GET `/jetpack/v4/paypal/buttons/{resource_id}`

Get a single payment resource.

**URL parameter:** `resource_id` — PayPal resource ID (format: `PLB-XXXXXXXXXXXX`)

**Response (200):** Full resource object (same as create response).

---

### PUT `/jetpack/v4/paypal/buttons/{resource_id}`

Full replacement update of a payment resource. Same request body as create.

**Response (200):** Updated resource object.

---

### DELETE `/jetpack/v4/paypal/buttons/{resource_id}`

Delete a payment resource. Returns success even if already deleted on PayPal (404 treated as success).

**Response (200):**

```json
{
  "deleted": true,
  "resource_id": "PLB-ABC123DEF456",
  "message": "Payment resource deleted successfully."
}
```

---

## Block Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `isApiManaged` | boolean | `false` | Whether this block uses the V2 API flow |
| `buttonType` | string | `stacked` | `stacked` (PayPal + Debit/Credit) or `inline` (PayPal only) |
| `buttonText` | string | `Pay Now` | Text shown next to the PayPal logo on the button |
| `resourceId` | string | — | PayPal resource ID (`PLB-...`) |
| `paymentLink` | string | — | PayPal payment URL |
| `productName` | string | — | Product name |
| `price` | string | — | Price value (e.g., `29.99`) |
| `currencyCode` | string | `USD` | ISO currency code |
| `productDescription` | string | — | Product description |
| `imageUrl` | string | — | Product image URL |
| `returnUrl` | string | — | Post-payment redirect URL |
| `scriptSrc` | string | — | Legacy: PayPal script URL |
| `hostedButtonId` | string | — | Legacy: hosted button ID |

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `paypal_no_credentials` | — | No PayPal credentials stored |
| `paypal_credentials_invalid` | 401 | Client ID or secret incorrect |
| `paypal_api_invalid_request` | 400 | Missing required fields |
| `paypal_api_not_authorized` | 403 | Account not authorized for Payment Links |
| `paypal_api_resource_not_found` | 404 | Resource deleted or expired |
| `paypal_api_unprocessable_entity` | 422 | Invalid amount (may be below currency minimum), unsupported currency/amount combination, or account-level business rule violation |
| `paypal_api_internal_server_error` | 500 | PayPal server error (retried automatically) |
| `paypal_api_timeout` | — | Request timed out (retried automatically) |
| `paypal_invalid_resource_id` | 400 | Invalid `PLB-` format |
| `paypal_untrusted_domain` | 502 | Payment link from non-PayPal domain |

---

## Authentication Flow

1. Merchant enters Client ID + Client Secret in the block editor
2. Plugin stores credentials in `wp_options` with `wp_hash()` integrity protection
3. Plugin exchanges credentials for an OAuth access token via `POST /v1/oauth2/token`
4. Token cached in WordPress transient AND expiration stored in `wp_options` as a fallback for object cache flushes (5-minute early refresh buffer applied to both)
5. All PayPal API requests use `Bearer {token}` authentication
6. On 401/403, token is refreshed and request retried once
7. On 500/502/503, request retried up to 3 times with exponential backoff

**BN Code:** The PayPal-Partner-Attribution-Id header is **not** supported on the Pay Links & Buttons API. Partner attribution is applied via the `?at_code=WooNCPS_Ecom_Wordpress` query parameter appended to the `payment_link` URL at render time. This parameter is not visible in WordPress REST API responses.
