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

A request that could not be signed at all never gets a response, so `Client::remote_request()` passes the signing failure to `check_signed_request_for_errors()` instead.

Note: XML-RPC faults arrive as HTTP 200 responses with an XML body. It's response is now checked by `check_xmlrpc_fault_for_errors`, which recovers the code/message pair from the fault string.

### Connection-state errors

Some errors describe a broken connection state that a successful outgoing request cannot disprove, rather than an individual failed request. These are stored with `error_type` set to `local_state` and are reported with `report_error()` skipping the WordPress.com round-trip, because the error is self-evidencing:

* `invalid_connection_owner` — reported by `Manager::get_connection_owner()` when the connection owner cannot be resolved (missing owner token, or the owner's WP user was deleted). The evidence is the site's own database.
* `xmlrpc_request_blocked` — reported by the connection health tests (`Connection_Health_Tests::evaluate_wpcom_connection_result()`) when WordPress.com reports that its request to the site was rejected (firewall, WAF, or server rule blocking `xmlrpc.php`). The evidence is WordPress.com's response to a signed request this site initiated. This error is invisible to both request flows above — the failing incoming requests never arrive, and outgoing requests keep succeeding — which is exactly why the health test reports it explicitly.

## Error classification

Each stored error carries two orthogonal classification fields:

| Field | Values | Meaning |
|---|---|---|
| `error_type` | `xmlrpc`, `rest`, `local_state`, `''` | The transport of the failed request; `local_state` marks connection-state errors that a successful outgoing request cannot disprove (stored as `connection` by package versions ≤ 8.8); `''` appears on entries stored by older package versions. |
| `error_direction` | `incoming`, `outgoing`, `''` | Whether the failed request was made to the site or by the site; `''` appears on legacy entries and `local_state`-type errors, which have no direction — the error factory discards any direction passed for them. |

## Supported error codes

Only a fixed list of error codes is handled: the `Error_Handler::$known_errors` allowlist, defined in [`src/class-error-handler.php`](../src/class-error-handler.php). Any error reported with a code outside this list is silently discarded — no log, no storage. The known codes fall into five groups, and each individual code is documented inline where the list is defined:

* **Incoming request token problems** — the request's own token is malformed or references an unknown user (`malformed_user_id`, `unknown_user`).
* **Incoming and outgoing token problems** — `malformed_token`, the one code reported on both sides: `Manager::internal_verify_xml_rpc_signature()` reports it for an incoming request whose token is empty/garbled or version-mismatched, and `Client::build_signed_request()` reports the same code when the local token has no secret half before it can sign an outgoing request. The two are distinguished by `error_direction` (`incoming` vs `outgoing`), not by code.
* **Locally stored token problems** — the token stored on this site is missing or corrupt (e.g. `no_user_tokens`, `token_malformed`, `no_valid_blog_token`).
* **Signature problems** — signing or signature verification failed, either for an incoming request or reported by WordPress.com for an outgoing one (e.g. `invalid_token`, `signature_mismatch`, `invalid_nonce`).
* **Connection state problems** — the connection state is broken in a way requests can't disprove (`invalid_connection_owner`, `xmlrpc_request_blocked`).

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
* A reporting gate only processes each error code once per hour, protecting both the site and WordPress.com from error storms. The gate is keyed by error code **and direction**: an outgoing error of a given code is verified locally and reported immediately, and that must not block an incoming error of the same code from independently clearing its own hourly gate to reach the WordPress.com verification round-trip (see [Incoming requests](#incoming-requests-wordpresscom--site)) — and vice versa. The `jetpack_connection_bypass_error_reporting_gate` filter can disable the gate (useful in tests).
* Only [supported error codes](#supported-error-codes) are stored — anything else is silently discarded.

## Displaying errors

Verified, displayable errors reach the front end through two channels, built from the same `get_displayable_errors()` data:

* **A generic wp-admin notice**, rendered by `handle_verified_errors()` on `admin_init`. This is a PHP-only fallback: plain text as well as a single action link for some codes (see [Display configuration](#display-configuration) below). It has no knowledge of React, and nothing to do with the JS consumers described next.
* **`connectionErrors` in the React initial state**, populated by `Initial_State::get_data()` (`Automattic\Jetpack\Connection\Initial_State`) from the same `get_displayable_errors()` call but via `jetpack_react_dashboard_error()`, and printed to the page as `window.JP_CONNECTION_INITIAL_STATE.connectionErrors` (or merged into a consuming plugin's own `JetpackScriptData.connection.connectionErrors` via `set_connection_script_data()`). This is the channel every React-based consumer reads from.

Only a subset of error codes is user-displayable (see `get_error_display_configs()`), and each displayable error is classified by audience — `site` (blog token), `owner` (the connection owner's token), or `user` (another user's token) — so consumers can render viewer-appropriate copy.

### React/JS consumers: `@automattic/jetpack-connection`

Do not re-derive connection-error copy or CTAs from `connectionErrors` by hand. The `@automattic/jetpack-connection` js-package (`projects/js-packages/connection`) is the single source of truth for turning that raw store data into something renderable, and is used across plugins including Jetpack, My Jetpack, Protect, Backup, Search, Publicize, Activity Log, and VideoPress:

* `useConnectionErrorNotice()` (`projects/js-packages/connection/hooks/use-connection-error-notice`) reads `connectionErrors` from the connection store, picks the effective error to show a given viewer (preferring an error with a message and an actionable, non-`'none'` action that isn't another user's to fix — see `isOtherUsersConnectionError`), and resolves it into ready-to-render `actions` via `resolveConnectionErrorActions()`. It also exposes `restoreConnection`/`isRestoringConnection` for the reconnect CTA, `connectionOwner`/`isCurrentUserConnectionOwner`, and `currentUserId` for viewer-scoping.
* `<ConnectionError />` is a thin wrapper around the hook that renders `<ConnectionErrorNotice />` directly, for consumers that don't need the hook's raw data.
* Passing `includeHealthErrors: true` additionally folds in `connectionHealthErrors` — a **separate** store slot for client-side connection *health-check* failures (see `helpers/map-health-check-errors.ts`), used as a fallback only when `connectionErrors` is empty. These are not `Error_Handler`-stored errors and don't go through the verification flow described above; they exist so a broken connection is still surfaced when nothing has been stored yet.

### Display configuration

`get_error_display_configs()` is the whitelist consulted by `get_displayable_errors()`: every code in `$known_errors` has an entry, either `false` (not shown to users — e.g. `malformed_user_id`, or `no_user_tokens`, which just means the user never connected) or an array of display configuration, kept even when empty (`array()` for a plain "please reconnect" default). A raw verified error whose code maps to `false`, or isn't in the table at all, is never surfaced. Comments on each entry record the display decision only — what the code *means* is documented once, on `$known_errors` itself.

Recognized config keys, all optional:

* `message_callback` — a callable that receives the stored error array and returns the displayable message, in place of the generic "please reconnect" copy.
* `default_admin_notice` — opts the code into the plain wp-admin notice by default (see [Enabling the error message](#enabling-the-error-message)); leave unset unless the error needs that broader, non-React reach.
* `notice_link` — a presentational `label`/`url` link appended to that same default admin notice.
* `support_link` — flags `error_data['support_link']` on the displayable error, for a code where reconnecting isn't reliably the fix and the viewer needs another way out (e.g. `signature_mismatch`, which could equally be a genuine secret desync or a proxy/CDN/WAF altering the request in transit).
* `survives_owner_promotion` — exempts the code from the [owner-promotion reduction](#owner-promotion-reduction). Reserve it for a code that isn't a token problem and so isn't waiting on the owner's reconnect to become actionable.

### Special-cased error codes

The one code with special-cased copy today is `invalid_connection_owner`, via `get_invalid_connection_owner_message()`: it distinguishes a merely-missing owner token (the original owner can just reconnect) from an owner whose WordPress user was deleted entirely (nobody can reconnect *as* them; a different admin has to become the new owner). `get_displayable_errors()` further tailors this message per viewer: the owner reading their own missing-token error gets first-person copy (the deleted-user flavor has no such case — an owner who no longer exists can't be the viewer), while a secondary admin's copy of an owner error — and whether they get a reconnect CTA at all — depends on whether `Manager::is_ownership_transferable()` says ownership can move to them; when it can't, the CTA is suppressed with `action = 'none'`. `xmlrpc_request_blocked` remains the other special code: reconnecting would be rejected by the same firewall rule that broke the connection, so its display config sets `support_link` and its (deliberately brief) message names the real cause and points at Site Health — the source of truth with the detailed diagnosis — which the admin notice also links to via `notice_link`. It also sets `survives_owner_promotion`, since a blocked request isn't a token problem the owner reconnecting would fix.

### Owner-promotion reduction

Beyond per-code config, `get_displayable_errors()` applies one cross-cutting reduction: `promote_owner_errors()`. While the connection owner's own connection is broken — any `owner`-audience error, or `invalid_connection_owner` at any audience — every other error in the set is dropped (unless its config sets `survives_owner_promotion`), because nothing else is independently actionable until the owner reconnects. This runs before the `jetpack_connection_get_verified_errors` filter, so consumer-injected errors are never dropped by it.

An error's *action* (`error_data['action']`, e.g. `'none'` to suppress the reconnect CTA — readers treat a missing action as `'reconnect'`) can come from either side: most reporters declare it at creation time (see `build_action_error_data()`), while `get_displayable_errors()` also sets it dynamically for the non-transferable secondary-admin case above. It's only ever emitted when it deviates from the default, since injecting an explicit `'reconnect'` could trip consumer code paths reserved for custom actions.

### Enabling the error message

The filters and action below customize only the plain wp-admin notice from `handle_verified_errors()`; they have no effect on the `connectionErrors` React data or on the [`@automattic/jetpack-connection` consumers](#reactjs-consumers-automatticjetpack-connection) that read it — those are customized through the hook's own `actionHandlers`/`customActions` props instead.

By default, no admin notice text is shown — except for error codes whose [display config](#display-configuration) opts into a default message (currently `xmlrpc_request_blocked`, which would otherwise be invisible outside Site Health). To enable text for other errors, or to override a default, use the `jetpack_connection_error_notice_message` filter. The second argument is an array with the details of all the errors (if more than one).

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

Stored errors are deleted automatically when the connection is restored or torn down — on site registration, reconnection, disconnection, token deletion, user unlink, and user-token update. Additionally, a successful API request (`jetpack_get_site_data_success`) clears all `xmlrpc` and `rest` type errors via `delete_all_api_errors()`; `local_state`-type errors are deliberately kept there, because a successful API round-trip refutes token/signature problems but says nothing about state such as a missing connection owner or WordPress.com being blocked from reaching the site.

`local_state` errors are instead cleared by whatever detects their condition. For `xmlrpc_request_blocked`, a passing WP.com connection test deletes the error via `delete_error_by_code()`; the test runs on Site Health page loads, Core's weekly Site Health cron, and a daily check on the `jetpack_heartbeat` cron (see the [connection health tests doc](connection-health-tests.md)), so the error both stays fresh while the blockage persists and clears within a day of the host resolving it. As a safety net, all errors expire 24 hours after they were last stored.

## Debugging

The [Jetpack Debug Tools](https://github.com/Automattic/jetpack/tree/trunk/projects/plugins/debug-helper) plugin's **Broken Token** module is the main tool for exercising this system on a test site: it can corrupt the blog or user token, generate sample errors of any type and direction, and display the raw contents of the stored and verified error options. The easiest way to install it is via the [Jetpack Beta Tester](https://jetpack.com/download-jetpack-beta/) plugin — activate the Bleeding Edge version of Jetpack Debug Tools from its plugin list; alternatively, build it from the monorepo and upload it manually.
