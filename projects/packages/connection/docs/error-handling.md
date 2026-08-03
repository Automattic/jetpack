# Error Handling

The Connection package detects, stores, and surfaces connection (authentication/signature) errors. `Automattic\Jetpack\Connection\Error_Handler` is the central class: it captures errors for requests in both directions, keeps them in the database, and drives the admin notices and dashboard messages that prompt users to fix a broken connection.

This document describes how errors are captured, classified, stored, displayed, and cleared, and how plugins can customize the experience.

## How errors are captured

### Incoming requests (WordPress.com → site)

When WordPress.com makes a signed request to the site and signature verification fails in `Manager::verify_xml_rpc_signature()`, the resulting error is reported to `Error_Handler::report_error()`. This covers both transports: XML-RPC requests, and signed REST requests, which `REST_Authentication` funnels into the same verification path.

Because anyone can send an unauthenticated request that fails verification, an incoming error cannot be trusted at face value. It goes through a verification round-trip:

1. The error is stored in the database as **unverified**.
2. The error details are encrypted and sent to WordPress.com.
3. WordPress.com checks that the token in the error actually belongs to this site and, if so, calls back the site's `jetpack/v4/verify_xmlrpc_error` REST endpoint with the error's nonce.
4. The site moves the matching error to the **verified** list. Only verified errors are eligible for display and error-recovery workflows.

### Outgoing requests (site → WordPress.com)

Every signed request made through `Client::remote_request()` has its response checked by `Error_Handler::check_api_response_for_errors()`. When a non-200 response carries a known error code — in either the legacy v1 JSON-API envelope (`{"error": ...}`) or the WP-API v2 envelope (`{"code": ...}`) — the error is stored directly as **verified**. No WordPress.com round-trip is needed: the error arrived in a response to a request this site itself initiated and signed, so the failed response is its own evidence.

Note: XML-RPC faults arrive as HTTP 200 responses with an XML body, so they are invisible to this check. Only errors surfaced at the HTTP level with a JSON error envelope are captured — one of the reasons outgoing calls are being migrated from XML-RPC to REST.

### Connection-state errors

Some errors describe broken local state rather than a failed request — for example `invalid_connection_owner`, reported by `Manager::get_connection_owner()` when the connection owner cannot be resolved (missing owner token, or the owner's WP user was deleted). These are stored with `error_type` set to `local_state` and are reported with `report_error()` skipping the WordPress.com round-trip: the evidence is the site's own database, so there is nothing for WordPress.com to confirm.

## Error classification

Each stored error carries two orthogonal classification fields:

| Field | Values | Meaning |
|---|---|---|
| `error_type` | `xmlrpc`, `rest`, `local_state`, `''` | The transport of the failed request; `local_state` marks connection-state errors that involve no request (stored as `connection` by package versions ≤ 8.8); `''` appears on entries stored by older package versions. |
| `error_direction` | `incoming`, `outgoing`, `''` | Whether the failed request was made to the site or by the site; `''` appears on legacy entries and `local_state`-type errors, which have no direction — the error factory discards any direction passed for them. |

## Supported error codes

Only a fixed list of error codes is handled: the `Error_Handler::$known_errors` allowlist, defined in [`src/class-error-handler.php`](../src/class-error-handler.php). Any error reported with a code outside this list is silently discarded — no log, no storage. The known codes fall into four groups, and each individual code is documented inline where the list is defined:

* **Incoming request token problems** — the token in the incoming request is malformed or references an unknown user (e.g. `malformed_token`, `unknown_user`).
* **Locally stored token problems** — the token stored on this site is missing or corrupt (e.g. `no_user_tokens`, `token_malformed`, `no_valid_blog_token`).
* **Signature problems** — signing or signature verification failed, either for an incoming request or reported by WordPress.com for an outgoing one (e.g. `invalid_token`, `signature_mismatch`, `invalid_nonce`).
* **Connection state problems** — local connection state is broken (`invalid_connection_owner`).

If WordPress.com starts returning a new error code, it will be invisible to this system until the code is added to the allowlist. When debugging missing errors, check the response body against this list first (see [Debugging](#debugging)).

## The standard error structure

All reporters build their `WP_Error` objects through the `Error_Handler::build_connection_wp_error()` / `build_connection_error_data()` factory, which defines the standard data shape: a `signature_details` array that always contains a `token` key (empty string when the error is not tied to a specific token), plus validated `error_type` and `error_direction` values. Errors that don't follow this shape are silently discarded by the storage layer, so use the factory rather than assembling the data by hand.

If you are reporting an error yourself, note the security contract of `report_error()`'s `$skip_wpcom_verification` parameter: verified errors trigger user-facing workflows, so only skip the WordPress.com round-trip when the error is self-evidencing (an outgoing response, or local connection state) — never for an error derived from an incoming request.

## Storage

Errors are stored in two options:

* `jetpack_connection_xmlrpc_errors` — unverified errors.
* `jetpack_connection_xmlrpc_verified_errors` — verified errors.

Both names contain "xmlrpc" because they predate REST support; they are intentionally kept as-is to avoid a data migration, and store errors of every type and direction.

Within each option, errors are keyed by error code, then by user ID:

```
[
  'invalid_token' => [
    '123' => [
      'error_code'      => 'invalid_token',
      'user_id'         => '123',
      'error_message'   => 'The token is invalid',
      'error_data'      => [ ... signature details ... ],
      'timestamp'       => 1234567890,
      'nonce'           => 'abc123def',
      'error_type'      => 'xmlrpc',
      'error_direction' => 'incoming',
    ],
  ],
]
```

The user ID identifies the credential that failed:

* `0` — the blog token.
* A positive integer — that user's token.
* `'invalid'` — the token could not be attributed to anyone (empty, truncated, or garbled). Unattributable errors are skipped by the display pipeline, since no viewer can act on them.

Storage limits and hygiene:

* At most 5 user IDs are kept per error code; the oldest is evicted when a sixth arrives.
* Errors expire 24 hours after being stored (checked on read).
* A reporting gate only processes each error code once per hour, protecting both the site and WordPress.com from error storms. The `jetpack_connection_bypass_error_reporting_gate` filter can disable the gate (useful in tests).
* Only [supported error codes](#supported-error-codes) are stored — anything else is silently discarded.

## Displaying errors

Verified, displayable errors are surfaced on admin pages through `handle_verified_errors()`: a generic admin notice, and an entry in the React dashboard's initial state. Only a subset of error codes is user-displayable (see `get_displayable_errors()`), and each displayable error is classified by audience — `site` (blog token), `owner` (the connection owner's token), or `user` (another user's token) — so consumers can render viewer-appropriate copy.

### Enabling the error message

By default, no admin notice text is shown. To enable it, use the `jetpack_connection_error_notice_message` filter. The second argument is an array with the details of all the errors (if more than one).

This basic example shows how to display a simple error message no matter the specific error type:

```PHP

add_filter( 'jetpack_connection_error_notice_message', 'my_function', 10, 2 );

function my_function( $message, $errors ) {
	return __( 'There is a problem with connection...', 'my_plugin' );
}

```

The example below enables the error message only if there's a specific error with the current logged user.

```PHP

add_filter( 'jetpack_connection_error_notice_message', 'my_function', 10, 2 );

function my_function( $message, $errors ) {

	// each key in the array is an error code.
	foreach ( $errors as $error_code => $user_errors ) {

		// each key in this array is a user ID.
		// This key can also be 0 or 'invalid' for errors with the blog token
		// See Automattic\Jetpack\Connection\Error_Handler for details on the array structure.
		if ( isset( $user_errors[ get_current_user_id() ] ) ) {
			$message = __( 'There is a problem with your user authorization...', 'my_plugin' );
		}

	}

	return $message;
}

```

### Further customizing error notices

If you want to completely change the admin notice, you can ignore the default message and hook into an action that will let you do whatever you want.

```PHP

add_action( 'jetpack_connection_error_notice', 'my_function' );

function my_function( $errors ) {

	// do stuff with the errors array

	// echo the error notice
	$message = sprintf(
		'<p>%s</p><a href="#" class="my-cta">%s</a>',
		esc_html__( 'my message', 'my_plugin' ),
		esc_html__( 'Fix it!', 'my_plugin' )
	);
	wp_admin_notice(
		$message,
		array(
			'type'               => 'error',
			'dismissible'        => true,
			'additional_classes' => array( 'jetpack-message', 'jp-connect' ),
			'paragraph_wrap'     => false,
			'attributes'         => array( 'style' => 'display:block !important;' ),
		)
	);
}

```

On selected hosting platforms (WoA, VIP, Newspack), the displayable errors themselves can additionally be filtered via `jetpack_connection_get_verified_errors`.

## Getting the errors yourself

If you want to access the errors stored in the database, you can use:

```PHP
\Automattic\Jetpack\Connection\Error_Handler::get_instance()->get_verified_errors()
```

Check [the class file](../src/class-error-handler.php) for further documentation on the structure of the stored errors.

## When errors are cleared

Stored errors are deleted automatically when the connection is restored or torn down — on site registration, reconnection, disconnection, token deletion, user unlink, and user-token update. Additionally, a successful API request (`jetpack_get_site_data_success`) clears all `xmlrpc` and `rest` type errors via `delete_all_api_errors()`; `local_state`-type errors are deliberately kept there, because a successful API round-trip refutes token/signature problems but says nothing about local state such as a missing connection owner.

## Debugging

The [Jetpack Debug Tools](https://github.com/Automattic/jetpack/tree/trunk/projects/plugins/debug-helper) plugin's **Broken Token** module is the main tool for exercising this system on a test site: it can corrupt the blog or user token, generate sample errors of any type and direction, and display the raw contents of the stored and verified error options.
