<?php
/**
 * REST controller for the modernized Backup dashboard.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers REST routes that back the modernized dashboard.
 *
 * Each bridge class declares its routes via `register_routes()` and uses
 * the shared `permission_check()` helper for the `manage_options` gate.
 * Routes only register when the modernization filter is on, so the
 * legacy plugin is byte-identical when the flag is off.
 */
class Rest_Controller {

	/**
	 * Every category WPCOM's rewind endpoints recognize in a `types` map.
	 *
	 * The first six are the whole-site checklist the Restore and Download
	 * screens render.
	 *
	 * `paths` covers the granular *download* shape only — `types: { paths:
	 * true }`, paired with `include_path_list` / `exclude_path_list`.
	 * Nothing sends it yet (C3), but leaving it out would make the file
	 * browser's granular download fail closed with a confusing 400 the day
	 * it is wired up.
	 *
	 * It does not carry over to granular *restore*, whatever that ends up
	 * spelling: the v1 route took `types: 'paths'` as a bare string, which
	 * is not a map at all and would never reach this allowlist. Granular
	 * restore has to establish its own shape against the v2 route before
	 * anything here can claim to cover it.
	 *
	 * This list has to grow if VaultPress adds a category. WPCOM's own
	 * route deliberately does not allowlist, so that it stays open to new
	 * types; we can afford to be stricter because we also own the UI that
	 * produces the values, and here a value that names nothing is the
	 * dangerous case rather than merely a useless one.
	 *
	 * @var string[]
	 */
	private const CATEGORIES = array(
		'themes',
		'plugins',
		'roots',
		'contents',
		'sqls',
		'uploads',
		'paths',
	);

	/**
	 * Hook entry point. Registers all bridge routes if the modernization
	 * filter is enabled.
	 *
	 * @return void
	 */
	public static function register_routes() {
		if ( ! Jetpack_Backup::is_modernized() ) {
			return;
		}

		Capabilities_Bridge::register_routes();
		Activity_Log_Bridge::register_routes();
		File_Browser_Bridge::register_routes();
		Download_Bridge::register_routes();
		Restore_Bridge::register_routes();
	}

	/**
	 * Permission check shared by every modernized-dashboard route.
	 *
	 * Mirrors the activity-log package's pattern: `manage_options` is
	 * necessary but not sufficient — every bridge eventually proxies a
	 * WPCOM endpoint that's user-gated, so a site admin who isn't
	 * personally WPCOM-linked needs a clearer error than the opaque
	 * "Only Administrators can query…" WPCOM returns.
	 *
	 * @return bool|WP_Error True when the current user can call the bridges, WP_Error otherwise.
	 */
	public static function permission_check() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		if ( ! ( new Connection_Manager() )->is_user_connected() ) {
			return new WP_Error(
				'user_not_connected',
				__( 'Your WordPress.com account is not connected to this site.', 'jetpack-backup-pkg' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}

	/**
	 * Returns the site's WPCOM blog id, or a `not_connected` WP_Error
	 * when the site hasn't been registered yet. Shared across the bridges
	 * so the `sprintf( '/sites/%d/…', $blog_id )` upstream path is never
	 * built with an empty id.
	 *
	 * @return int|WP_Error Blog id, or WP_Error when not connected.
	 */
	public static function get_blog_id_or_error() {
		$blog_id = (int) Jetpack_Options::get_option( 'id' );
		if ( ! $blog_id ) {
			return new WP_Error(
				'not_connected',
				__( 'This site is not connected to Jetpack.', 'jetpack-backup-pkg' ),
				array( 'status' => 412 )
			);
		}
		return $blog_id;
	}

	/**
	 * Rebuild a restore/download `types` parameter as a named map.
	 *
	 * The PHP counterpart of the client's `requireTypes`, and the reason
	 * it exists here rather than being trusted from the request: WordPress
	 * validates `'type' => 'object'` with `rest_is_object()`, which is
	 * `is_array()`. A JSON list therefore passes validation and arrives as
	 * a PHP list, whose numeric keys WPCOM reads as category names. The
	 * route schema rejects the realistic version of that, but only because
	 * the members fail a boolean check — shape itself is never asserted —
	 * so the guarantee is made here, where the payload is actually built.
	 *
	 * Only known categories with a truthy value survive, and every
	 * surviving value is normalized to `true`. Values are read with
	 * `rest_sanitize_boolean()` so a form-encoded `"false"` or `"0"` means
	 * skip rather than select.
	 *
	 * Unknown keys are dropped rather than forwarded, which is what makes
	 * `request_names_no_types()` a total guard: without it a payload naming
	 * only categories WPCOM does not recognize would satisfy the guard and
	 * be sent on, and what WPCOM does with a `types` that matches nothing
	 * is not characterized. Dropping them means such a payload names
	 * nothing, and is refused. The realistic way to get there is not an
	 * attacker — an admin who can craft the request can already omit
	 * `types` for a whole-site operation — but a future client-side typo:
	 * renaming a checklist key `sqls` to `sql` would otherwise go through
	 * silently.
	 *
	 * @param mixed $types Raw `types` parameter from the request.
	 * @return array<string, true> Named types, empty when none are selected.
	 */
	public static function named_types( $types ) {
		if ( ! is_array( $types ) && ! is_object( $types ) ) {
			return array();
		}

		$named = array();
		foreach ( (array) $types as $key => $value ) {
			if ( in_array( $key, self::CATEGORIES, true ) && rest_sanitize_boolean( $value ) ) {
				$named[ $key ] = true;
			}
		}
		return $named;
	}

	/**
	 * Whether the request supplied a `types` parameter that names no category.
	 *
	 * The distinction this draws is the whole point of the helper, and it
	 * is the opposite of what it looks like. An **absent** `types` is a
	 * valid, deliberate request for every category — WPCOM's contract is
	 * "omit it for everything" — so the mutations leave the key out for a
	 * whole-site restore or a full archive. A **supplied** `types` that
	 * survives into nothing is the other thing entirely: the caller tried
	 * to name categories and named none, and forwarding that as an
	 * omission would quietly upgrade "restore nothing" into "restore
	 * everything", against a live site.
	 *
	 * It takes the request rather than the value because the value cannot
	 * answer the question. `{"types": null}` is supplied and names nothing,
	 * but arrives as the same `null` an omitted key does — and the schema
	 * never sees it, since `WP_REST_Request::has_valid_params()` skips
	 * `validate_callback` for a null param. `has_param()` is the only thing
	 * that knows the key was on the wire.
	 *
	 * Nothing upstream catches it on both routes. The v2 restore route
	 * rejects a `types` naming nothing, but `/rewind/downloads` does not,
	 * so the guarantee has to be made here for the pair to behave alike.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return bool True when the caller supplied a `types` that names no category.
	 */
	public static function request_names_no_types( WP_REST_Request $request ) {
		if ( ! $request->has_param( 'types' ) ) {
			return false;
		}

		return ! self::named_types( $request->get_param( 'types' ) );
	}

	/**
	 * Convert a transport-level failure into a bridge error.
	 *
	 * `Client::wpcom_json_api_request_as_*` answers with a `WP_Error` when
	 * the request never reached WPCOM at all — DNS, TLS, or the cURL
	 * timeout behind JETPACK-2173's "cURL error 28". Returning that error
	 * unchanged hands cURL's own text to the browser, where the dashboard
	 * renders the message verbatim in a notice; it also carries no
	 * `status`, so core answers 500 for what is really a reachability
	 * problem rather than a server fault.
	 *
	 * The raw text is preserved under `transport` rather than discarded.
	 * It is the only part a support agent can act on, and it is the same
	 * reason the non-200 branches forward WPCOM's status instead of
	 * flattening it.
	 *
	 * Always 502: telling a timeout from a refused connection would mean
	 * matching on cURL's English message text, and no caller reads the
	 * difference.
	 *
	 * @param WP_Error $error Transport error from the HTTP client.
	 * @param string   $code  Bridge error code for the operation that failed.
	 * @return WP_Error
	 */
	public static function transport_error( WP_Error $error, $code ) {
		return new WP_Error(
			$code,
			__( 'Could not reach WordPress.com. Check your connection and try again.', 'jetpack-backup-pkg' ),
			array(
				'status'    => 502,
				'transport' => array(
					'code'    => $error->get_error_code(),
					'message' => $error->get_error_message(),
				),
			)
		);
	}

	/**
	 * Longest either half of a forwarded upstream reason may be.
	 *
	 * Neither field is bounded upstream and both travel to the browser on
	 * every failed request, so a VaultPress stack trace in `message` would
	 * otherwise be copied out verbatim.
	 *
	 * @var int
	 */
	private const REASON_MAX_LENGTH = 200;

	/**
	 * Convert a non-200 answer from WordPress.com into a bridge error.
	 *
	 * The counterpart of `transport_error()`, for the failure where the
	 * request did arrive and WordPress.com refused it. Every bridge used to
	 * spell this branch out for itself, and every spelling threw away the
	 * only part that says *why*: a plan problem and an expired token both
	 * reached a support agent as `restore_initiate_failed` / "Could not
	 * start the backup restore.", distinguishable only by a status code.
	 *
	 * WordPress.com's own reason is preserved under `wpcom`, deliberately
	 * shaped like `transport_error()`'s `transport` key. The client decides
	 * what to do with it: `failureMessage()` in `_helpers.ts` maps the
	 * codes whose meaning is the code itself, and *renders* the message for
	 * the ones — `rewind_error`, `authorization_required` — where one code
	 * spans several unrelated situations and only the sentence tells them
	 * apart.
	 *
	 * That the message can reach a reader is why the flattening and the
	 * 200-character clip below are not housekeeping. They are the whole
	 * reason it is safe to render, so do not relax them. It stays a plain
	 * string all the way out; the client escapes it by rendering it as
	 * React children.
	 *
	 * Only those two fields are forwarded, never the body — an error body
	 * is unbounded and can echo the request that produced it.
	 *
	 * The status is clamped to the failure range rather than merely tested
	 * for truthiness, and that is load-bearing. The retrieval helper hands
	 * back whatever the transport put there, so a *success* code can reach
	 * this function: four of the callers compare `200 !== $status_code`
	 * without casting, which a numeric-string `'200'` fails, routing a
	 * perfectly good response into the failure branch. Forwarding it would then set `data.status` to 200, WordPress
	 * would serve the error envelope as HTTP 200, `apiFetch` would resolve
	 * instead of rejecting, and `apiCall()` would never throw — so a
	 * failed restore would run the mutation's `onSuccess` and report a
	 * restore that never started. A visible failure becoming an invisible
	 * false success is the worst outcome available on a destructive
	 * operation, so anything outside 4xx/5xx becomes a 500.
	 *
	 * The same clamp is what keeps junk out. `(int)` is a total function:
	 * `'2 Bad'` is 2, `3.7` is 3, `true` is 1, and a zero must never reach
	 * a `WP_Error` at all, because core hands the status to
	 * `status_header()` and a zero there emits an invalid status line.
	 *
	 * What the cast does buy, and the reason it is here rather than an
	 * `is_int()` test, is that a genuine `'404'` from a transport that
	 * reports statuses as strings now travels as 404 instead of being
	 * flattened to 500. The client is literal about the type too:
	 * `isAmbiguousFailure()` only reads a status that is already a number.
	 *
	 * @param array|\WP_Error $response The wp_remote_* response. Non-200 by the time it gets here.
	 * @param string          $code     Bridge error code for the operation that failed.
	 * @param string          $message  Translated message for the reader.
	 * @return WP_Error
	 */
	public static function upstream_error( $response, $code, $message ) {
		$status_code = (int) wp_remote_retrieve_response_code( $response );

		$data = array( 'status' => $status_code >= 400 && $status_code <= 599 ? $status_code : 500 );

		$reason = self::upstream_reason( wp_remote_retrieve_body( $response ) );
		if ( ! empty( $reason ) ) {
			$data['wpcom'] = $reason;
		}

		return new WP_Error( $code, $message, $data );
	}

	/**
	 * Read WordPress.com's own reason out of a response body.
	 *
	 * Three shapes have to be read here and they disagree about where the
	 * reason lives. A wpcom/v2 route serializes a `WP_Error` as `{ code,
	 * message, data }`. The older v1 envelope names that same token `error`
	 * and keeps prose beside it in `message`. And the restore endpoint's
	 * own `{ ok: false, error }` body puts VaultPress's sentence directly
	 * in `error`, with no token anywhere.
	 *
	 * So `error` is sometimes a token and sometimes a sentence, and the
	 * only thing separating them is shape: a `WP_Error` code has no
	 * whitespace in it, and a VaultPress refusal is a sentence. Sorting on
	 * that is what keeps the two halves honest. The client matches `code`
	 * against a list of codes it knows, so a sentence landing there would
	 * become a key that can never match — the reason lost again, in a
	 * quieter way.
	 *
	 * Sorting is all it does, though: nothing is ever discarded. When
	 * `error` holds a sentence *and* `message` holds another — which is
	 * what a VaultPress refusal wrapped in a generic envelope looks like —
	 * both are kept, `error` first, because that is the specific half. An
	 * earlier revision promoted `error` only when `message` was empty, and
	 * so threw away the specific reason in exactly the shape this function
	 * exists to read.
	 *
	 * `/u` on the whitespace test is not cosmetic. Without it `\s` is
	 * ASCII-only, so a sentence spaced with U+00A0 has "no whitespace" and
	 * lands in `code` — the precise outcome the sort is here to prevent.
	 *
	 * @param string|array $body Raw response body, or one already decoded.
	 * @return array<string, string> `code` and/or `message`; empty when the body names no reason.
	 */
	public static function upstream_reason( $body ) {
		$decoded = is_array( $body ) ? $body : json_decode( (string) $body, true );
		if ( ! is_array( $decoded ) ) {
			return array();
		}

		$token = '';
		foreach ( array( 'code', 'error' ) as $key ) {
			if ( isset( $decoded[ $key ] ) && is_string( $decoded[ $key ] ) && '' !== trim( $decoded[ $key ] ) ) {
				$token = trim( $decoded[ $key ] );
				break;
			}
		}

		$prose = isset( $decoded['message'] ) && is_string( $decoded['message'] ) ? trim( $decoded['message'] ) : '';

		$reason    = array();
		$sentences = array();

		if ( '' !== $token && ! preg_match( '/\s/u', $token ) ) {
			$reason['code'] = self::clip_reason( $token );
		} elseif ( '' !== $token ) {
			$sentences[] = $token;
		}

		// Guarded against the duplicate rather than assumed away: some
		// envelopes repeat the same text in both keys, and joining it to
		// itself would say everything twice inside a budget meant for one.
		if ( '' !== $prose && ! in_array( $prose, $sentences, true ) ) {
			$sentences[] = $prose;
		}

		if ( ! empty( $sentences ) ) {
			$reason['message'] = self::clip_reason( implode( ' ', $sentences ) );
		}

		return $reason;
	}

	/**
	 * Flatten and shorten one half of an upstream reason.
	 *
	 * Newlines go first so a multi-line upstream message cannot spend the
	 * whole budget on indentation before it says anything.
	 *
	 * `mb_substr()` rather than `substr()`, and the reason is mostly not
	 * the exotic one. A byte-wise cut spends the budget in bytes, so a
	 * reason written in a script that costs three bytes a character keeps
	 * a third of what it was allotted — 67 characters of 200, in the test
	 * that pins this. The encoding damage is the smaller half: the cut
	 * lands inside a character and leaves the field invalid UTF-8, which
	 * `wp_json_encode()` does not reject — its sanity check silently
	 * rewrites the broken bytes, so the reason arrives with a `?` on the
	 * end and nothing anywhere says why.
	 *
	 * The flatten runs in Unicode mode so a non-breaking or ideographic
	 * space collapses like any other, which also means it returns null on
	 * invalid UTF-8. The ASCII pass stands behind it so the bound is still
	 * enforced in that case. Unreachable in practice — every string that
	 * gets here came out of a `json_decode()`, which refuses invalid
	 * UTF-8 outright — but a silent null would turn the whole reason into
	 * an empty string, which is a poor way to find out.
	 *
	 * @param string $value Raw upstream text.
	 * @return string
	 */
	private static function clip_reason( $value ) {
		$flattened = preg_replace( '/\s+/u', ' ', $value );
		if ( null === $flattened ) {
			$flattened = preg_replace( '/\s+/', ' ', $value );
		}

		$value = trim( (string) $flattened );

		if ( mb_strlen( $value, 'UTF-8' ) <= self::REASON_MAX_LENGTH ) {
			return $value;
		}

		return rtrim( mb_substr( $value, 0, self::REASON_MAX_LENGTH, 'UTF-8' ) ) . '…';
	}
}
