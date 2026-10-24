<?php
/**
 * Writes the sending records at Cloudflare with a user-supplied API token.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Cloudflare DNS writer. The token is used for one request cycle; Send never stores or logs it.
 */
class Cloudflare_Dns {

	/**
	 * Cloudflare API base URL.
	 *
	 * @var string
	 */
	const API_BASE = 'https://api.cloudflare.com/client/v4';

	/**
	 * HTTP timeout for each Cloudflare call, in seconds.
	 *
	 * @var int
	 */
	const TIMEOUT = 15;

	/**
	 * Note left on records we create, so people can tell them apart in Cloudflare.
	 *
	 * @var string
	 */
	const RECORD_COMMENT = 'Added by Jetpack Send';

	/**
	 * Cloudflare error codes that mean the token itself is unusable.
	 *
	 * @var int[]
	 */
	const BAD_TOKEN_CODES = array( 1000, 1001, 6003, 6111, 9103, 9106, 9109 );

	/**
	 * SPF allows 10 DNS lookups. Stay below it, since nested includes aren't counted.
	 *
	 * @var int
	 */
	const SPF_LOOKUP_LIMIT = 10;

	/**
	 * Whether to offer the token paste for a detection result.
	 *
	 * True when the provider is Cloudflare, the domain is editable, and the
	 * `jetpack_send_cloudflare_api_enabled` filter (default true) allows it.
	 *
	 * @param array $dns_host Dns_Host::detect() result.
	 * @return bool
	 */
	public static function is_available( array $dns_host ) {
		return 'cloudflare' === ( $dns_host['provider'] ?? null ) && self::is_allowed( $dns_host );
	}

	/**
	 * Whether writing is allowed at all for this detection: an editable domain and the filter says yes.
	 *
	 * @param array $dns_host Dns_Host detection (may be empty when unknown).
	 * @return bool
	 */
	public static function is_allowed( array $dns_host ) {
		if ( array_key_exists( 'editable', $dns_host ) && ! $dns_host['editable'] ) {
			return false;
		}

		/**
		 * Filters whether Send offers to add the records at Cloudflare with a pasted API token.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool  $enabled  Whether to offer it. Default true.
		 * @param array $dns_host The DNS host detection for the sending domain.
		 */
		return (bool) apply_filters( 'jetpack_send_cloudflare_api_enabled', true, $dns_host );
	}

	/**
	 * Find the zone for the domain and write each record with `proxied: false`.
	 *
	 * An `spf` record is merged into the zone's one `v=spf1` TXT at the root (never a second
	 * one). Records already right are left alone, and an optional record that can't be written
	 * doesn't fail the run.
	 *
	 * @param string  $token   Cloudflare API token (Zone > DNS > Edit on one zone).
	 * @param string  $domain  Sending domain.
	 * @param array[] $records Records `{type, name, value, purpose, optional}` with full names.
	 * @return array{success: bool, records: array[]}|WP_Error Per record: `{purpose, name, action, optional?, reason?, error?}`,
	 *                                                         action `created|updated|unchanged|skipped|failed`; `reason`
	 *                                                         `email_routing|locked` when Cloudflare locks the record, `refused`
	 *                                                         when it turned down the write of an optional one. Errors:
	 *                                                         `jetpack_send_cloudflare_bad_token` (400),
	 *                                                         `jetpack_send_cloudflare_no_zone` (400),
	 *                                                         `jetpack_send_cloudflare_too_broad` (400),
	 *                                                         `jetpack_send_cloudflare_forbidden` (403),
	 *                                                         `jetpack_send_cloudflare_rate_limited` (429),
	 *                                                         `jetpack_send_cloudflare_error` (502).
	 */
	public static function apply(
		// phpcs:ignore PHPCompatibility.Attributes.NewAttributes.PHPNativeAttributeFound -- Hides the token from stack traces on PHP 8.2+; a comment on older PHP.
		#[\SensitiveParameter]
		$token,
		$domain,
		array $records
	) {
		$token  = trim( (string) $token );
		$domain = strtolower( rtrim( trim( (string) $domain ), '.' ) );
		// The token is used once and never kept, debug log included.
		Debug_Log::secret( $token );

		// Cloudflare tokens are URL-safe strings; anything else never leaves the site.
		if ( ! preg_match( '/^[A-Za-z0-9_-]{20,256}$/', $token ) ) {
			return self::error( 'bad_token' );
		}

		$verified = self::verify( $token );
		if ( is_wp_error( $verified ) ) {
			return $verified;
		}

		$scope = self::check_scope( $token, $domain );
		if ( is_wp_error( $scope ) ) {
			return $scope;
		}

		$zone = self::find_zone( $token, $domain );
		if ( is_wp_error( $zone ) ) {
			return $zone;
		}

		$results = array();
		$success = true;
		foreach ( $records as $record ) {
			if ( ! is_array( $record ) ) {
				continue;
			}
			$optional = ! empty( $record['optional'] );
			$result   = self::write_record( $token, $zone, $domain, $record );
			self::note_write( $record, is_wp_error( $result ) ? array( 'action' => 'failed' ) : $result );
			if ( is_wp_error( $result ) ) {
				if ( ! array_intersect( array( 'created', 'updated' ), array_column( $results, 'action' ) ) ) {
					return $result;
				}
				// Some records already went in, so report them rather than only the error.
				$results[] = array(
					'purpose' => (string) ( $record['purpose'] ?? '' ),
					'name'    => strtolower( rtrim( (string) ( $record['name'] ?? '' ), '.' ) ),
					'action'  => 'failed',
					'error'   => $result->get_error_message(),
				) + ( $optional ? array( 'optional' => true ) : array() );
				$success   = false;
				break;
			}
			if ( $optional ) {
				$result['optional'] = true;
			}
			$results[] = $result;
			// Sending works without an optional record, so its failure is reported but doesn't fail the run.
			$success = $success && ( $optional || 'failed' !== ( $result['action'] ?? 'failed' ) );
		}

		return array(
			'success' => $success && array() !== $results,
			'records' => $results,
		);
	}

	/**
	 * Note one record write in the debug log.
	 *
	 * @param array $record The record asked for.
	 * @param array $result What happened: `action`, maybe `reason`.
	 * @return void
	 */
	private static function note_write( array $record, array $result ) {
		$action  = (string) ( $result['action'] ?? 'failed' );
		$purpose = (string) ( $record['purpose'] ?? '' );
		Debug_Log::add(
			'failed' === $action ? 'error' : ( 'skipped' === $action ? 'warning' : 'info' ),
			'domain',
			'cloudflare.write',
			/* translators: 1: what happened, e.g. created, 2: what the record is for, e.g. dkim. */
			sprintf( __( 'Cloudflare: %1$s the %2$s record.', 'jetpack-send-pkg' ), $action, $purpose ),
			array(
				'purpose' => $purpose,
				'name'    => strtolower( rtrim( (string) ( $record['name'] ?? '' ), '.' ) ),
				'type'    => (string) ( $record['type'] ?? '' ),
				'action'  => $action,
				'reason'  => (string) ( $result['reason'] ?? '' ),
			)
		);
	}

	/**
	 * Check the token is valid and active.
	 *
	 * @param string $token Token.
	 * @return true|WP_Error
	 */
	private static function verify(
		// phpcs:ignore PHPCompatibility.Attributes.NewAttributes.PHPNativeAttributeFound -- Hides the token from stack traces on PHP 8.2+; a comment on older PHP.
		#[\SensitiveParameter]
		$token
	) {
		$response = self::request( $token, 'GET', '/user/tokens/verify' );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		if ( 'active' !== ( $response['result']['status'] ?? '' ) ) {
			return self::error( 'bad_token' );
		}
		return true;
	}

	/**
	 * Refuse a key that can see more than one zone: it must be limited to the sending domain's.
	 *
	 * @param string $token  Token.
	 * @param string $domain Sending domain, for the message.
	 * @return true|WP_Error
	 */
	private static function check_scope(
		// phpcs:ignore PHPCompatibility.Attributes.NewAttributes.PHPNativeAttributeFound -- Hides the token from stack traces on PHP 8.2+; a comment on older PHP.
		#[\SensitiveParameter]
		$token,
		$domain
	) {
		$response = self::request( $token, 'GET', '/zones?' . http_build_query( array( 'per_page' => 2 ) ) );
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$zones = array_filter( (array) ( $response['result'] ?? array() ), 'is_array' );
		$total = (int) ( $response['result_info']['total_count'] ?? count( $zones ) );
		if ( count( $zones ) > 1 || $total > 1 ) {
			return self::error( 'too_broad', $domain );
		}
		return true;
	}

	/**
	 * The most specific zone this token can see for the domain: the domain itself, then each parent.
	 *
	 * @param string $token  Token.
	 * @param string $domain Sending domain.
	 * @return array{id: string, name: string}|WP_Error
	 */
	private static function find_zone(
		// phpcs:ignore PHPCompatibility.Attributes.NewAttributes.PHPNativeAttributeFound -- Hides the token from stack traces on PHP 8.2+; a comment on older PHP.
		#[\SensitiveParameter]
		$token,
		$domain
	) {
		$labels = explode( '.', $domain );
		for ( $remaining = count( $labels ); $remaining >= 2; $remaining-- ) {
			$candidate = implode( '.', $labels );
			$response  = self::request( $token, 'GET', '/zones?' . http_build_query( array( 'name' => $candidate ) ) );
			if ( is_wp_error( $response ) ) {
				return $response;
			}
			foreach ( (array) ( $response['result'] ?? array() ) as $zone ) {
				if ( is_array( $zone ) && ! empty( $zone['id'] ) && strtolower( (string) ( $zone['name'] ?? '' ) ) === $candidate ) {
					return array(
						'id'   => (string) $zone['id'],
						'name' => $candidate,
					);
				}
			}
			array_shift( $labels );
		}
		return self::error( 'no_zone', $domain );
	}

	/**
	 * Create, update or leave one record.
	 *
	 * @param string $token  Token.
	 * @param array  $zone   Zone `{id, name}`.
	 * @param string $domain Sending domain.
	 * @param array  $record Record `{type, name, value, purpose}`.
	 * @return array{purpose: string, name: string, action: string, reason?: string, error?: string}|WP_Error A WP_Error
	 *                                                                                                       only for problems that stop every record.
	 */
	private static function write_record(
		// phpcs:ignore PHPCompatibility.Attributes.NewAttributes.PHPNativeAttributeFound -- Hides the token from stack traces on PHP 8.2+; a comment on older PHP.
		#[\SensitiveParameter]
		$token,
		array $zone,
		$domain,
		array $record
	) {
		$purpose = (string) ( $record['purpose'] ?? '' );
		$name    = strtolower( rtrim( (string) ( $record['name'] ?? '' ), '.' ) );
		$type    = strtoupper( (string) ( $record['type'] ?? '' ) );
		$value   = (string) ( $record['value'] ?? '' );
		$result  = array(
			'purpose' => $purpose,
			'name'    => $name,
			'action'  => 'failed',
		);

		// Never write outside the zone, or anything but our own records at their own names.
		$in_zone = $name === $zone['name'] || substr( $name, -strlen( '.' . $zone['name'] ) ) === '.' . $zone['name'];
		if ( ! $in_zone || ! self::is_expected( $purpose, $name, $type, $domain ) || '' === $value ) {
			$result['error'] = __( 'This record can’t be added here. Add it yourself instead.', 'jetpack-send-pkg' );
			return $result;
		}

		$path     = '/zones/' . rawurlencode( $zone['id'] ) . '/dns_records';
		$existing = self::request(
			$token,
			'GET',
			$path . '?' . http_build_query(
				array(
					'name'     => $name,
					'per_page' => 100,
				)
			)
		);
		if ( is_wp_error( $existing ) ) {
			return self::stops_everything( $existing ) ? $existing : self::failed( $result );
		}
		$existing = array_values( array_filter( (array) ( $existing['result'] ?? array() ), 'is_array' ) );

		$plan = 'CNAME' === $type ? self::plan_cname( $existing, $value ) : self::plan_txt( $existing, $value, $purpose, ! empty( $record['optional'] ) );
		if ( isset( $plan['reason'] ) ) {
			$result['reason'] = $plan['reason'];
		}
		if ( isset( $plan['error'] ) ) {
			$result['error'] = $plan['error'];
			return $result;
		}
		$planned = $plan['action'] ?? '';
		$content = $plan['content'] ?? '';
		if ( 'unchanged' === $planned || 'skipped' === $planned ) {
			$result['action'] = $planned;
			return $result;
		}

		if ( 'update' === $planned ) {
			$response = self::request(
				$token,
				'PATCH',
				$path . '/' . rawurlencode( $plan['id'] ?? '' ),
				array(
					'content' => $content,
					'proxied' => false,
				)
			);
			$action   = 'updated';
		} else {
			$response = self::request(
				$token,
				'POST',
				$path,
				array(
					'type'    => $type,
					'name'    => $name,
					'content' => $content,
					'ttl'     => 1,
					'proxied' => false,
					'comment' => self::RECORD_COMMENT,
				)
			);
			$action   = 'created';
		}

		if ( is_wp_error( $response ) ) {
			// Sending works without an optional record, so a refused write skips it like a locked one.
			if ( ! empty( $record['optional'] ) && self::stops_everything( $response ) ) {
				$result['action'] = 'skipped';
				$result['reason'] = 'refused';
				return $result;
			}
			return self::stops_everything( $response ) ? $response : self::failed( $result );
		}
		$result['action'] = $action;
		return $result;
	}

	/**
	 * Whether a record is one of ours: the name and type its purpose allows for the sending domain.
	 *
	 * @param string $purpose `lockdown`, `dkim` or `spf`.
	 * @param string $name    Full record name, lowercase.
	 * @param string $type    Record type, uppercase.
	 * @param string $domain  Sending domain.
	 * @return bool
	 */
	private static function is_expected( $purpose, $name, $type, $domain ) {
		switch ( $purpose ) {
			case 'lockdown':
				// CNAME when the values live in a zone Send runs, TXT otherwise.
				return '_mailchannels.' . $domain === $name && in_array( $type, array( 'TXT', 'CNAME' ), true );
			case 'dkim':
				return 1 === preg_match( '/^[a-z0-9_-]+\._domainkey\.' . preg_quote( $domain, '/' ) . '$/', $name )
					&& in_array( $type, array( 'TXT', 'CNAME' ), true );
			case 'spf':
				return $domain === $name && 'TXT' === $type;
			default:
				return false;
		}
	}

	/**
	 * What to do for a TXT record, given the records already at its name.
	 *
	 * @param array[] $existing Records at the name.
	 * @param string  $value    Value we want.
	 * @param string  $purpose  `lockdown`, `dkim` or `spf`.
	 * @param bool    $optional Whether the record is optional.
	 * @return array{action?: string, id?: string, content?: string, reason?: string, error?: string}
	 */
	private static function plan_txt( array $existing, $value, $purpose, $optional = false ) {
		$txt = array();
		foreach ( $existing as $record ) {
			$type = strtoupper( (string) ( $record['type'] ?? '' ) );
			if ( 'CNAME' === $type ) {
				return array( 'error' => __( 'There’s an old record with the same name. Delete it at Cloudflare, then try again.', 'jetpack-send-pkg' ) );
			}
			if ( 'TXT' === $type ) {
				$txt[] = $record;
			}
		}

		// Only touch the one record of our kind at this name; other TXT records stay as they are.
		$prefix = array(
			'lockdown' => 'v=mc1',
			'dkim'     => 'v=dkim1',
			'spf'      => 'v=spf1',
		)[ $purpose ] ?? '';
		$ours   = array();
		foreach ( $txt as $record ) {
			$content = self::txt_content( (string) ( $record['content'] ?? '' ) );
			if ( '' !== $prefix ? 0 === stripos( $content, $prefix ) : $content === $value ) {
				$ours[] = array_merge( $record, array( 'content' => $content ) );
			}
		}

		// A new sender list would change how the domain's other mail is judged, so only add to an existing one.
		if ( array() === $ours && 'spf' === $purpose && $optional ) {
			return array( 'action' => 'unchanged' );
		}
		if ( array() === $ours ) {
			return array(
				'action'  => 'create',
				'content' => $value,
			);
		}
		if ( count( $ours ) > 1 ) {
			return 'spf' === $purpose
				? array( 'error' => __( 'Your domain has more than one of these records already. Merge them into one at Cloudflare, then try again.', 'jetpack-send-pkg' ) )
				: array( 'error' => __( 'There’s an old record with the same name. Delete it at Cloudflare, then try again.', 'jetpack-send-pkg' ) );
		}

		$current = $ours[0];
		$wanted  = self::merged_value( $current['content'], $value, $purpose );
		if ( null === $wanted ) {
			return array( 'error' => __( 'Your domain’s sender list is full. Add it yourself instead.', 'jetpack-send-pkg' ) );
		}
		if ( self::compact( $current['content'] ) === self::compact( $wanted ) ) {
			return array( 'action' => 'unchanged' );
		}

		// Cloudflare refuses edits to a record it locks, such as Email Routing's own sender list.
		$lock = self::lock_reason( $current );
		if ( '' !== $lock ) {
			if ( $optional ) {
				return array(
					'action' => 'skipped',
					'reason' => $lock,
				);
			}
			return array(
				'reason' => $lock,
				'error'  => 'email_routing' === $lock
					? __( 'Cloudflare Email Routing manages this record, so Jetpack can’t change it. Unlock it in your Email Routing settings at Cloudflare, then try again.', 'jetpack-send-pkg' )
					: __( 'Cloudflare has locked this record, so Jetpack can’t change it.', 'jetpack-send-pkg' ),
			);
		}

		return array(
			'action'  => 'update',
			'id'      => (string) ( $current['id'] ?? '' ),
			'content' => $wanted,
		);
	}

	/**
	 * Why Cloudflare won't let a record be edited: `email_routing` for Email Routing's own records,
	 * `locked` for any other read-only record, '' when it can be edited.
	 *
	 * @param array $record A record as Cloudflare lists it.
	 * @return string
	 */
	private static function lock_reason( array $record ) {
		$meta = isset( $record['meta'] ) && is_array( $record['meta'] ) ? $record['meta'] : array();
		if ( empty( $meta['read_only'] ) && empty( $record['locked'] ) ) {
			return '';
		}
		return empty( $meta['email_routing'] ) ? 'locked' : 'email_routing';
	}

	/**
	 * What to do for a CNAME record, given the records already at its name.
	 *
	 * @param array[] $existing Records at the name.
	 * @param string  $target   Target we want.
	 * @return array{action?: string, id?: string, content?: string, error?: string}
	 */
	private static function plan_cname( array $existing, $target ) {
		$cname = null;
		foreach ( $existing as $record ) {
			$type = strtoupper( (string) ( $record['type'] ?? '' ) );
			if ( 'CNAME' !== $type ) {
				// A CNAME can't share its name with anything, and the other record isn't ours to delete.
				return array( 'error' => __( 'There’s an old record with the same name. Delete it at Cloudflare, then try again.', 'jetpack-send-pkg' ) );
			}
			$cname = $record;
		}

		if ( null === $cname ) {
			return array(
				'action'  => 'create',
				'content' => $target,
			);
		}
		$same_target = strtolower( rtrim( (string) ( $cname['content'] ?? '' ), '.' ) ) === strtolower( rtrim( $target, '.' ) );
		if ( ! $same_target ) {
			// Someone else's pointer; only ever turn the proxy off on our own.
			return array( 'error' => __( 'There’s an old record with the same name. Delete it at Cloudflare, then try again.', 'jetpack-send-pkg' ) );
		}
		if ( empty( $cname['proxied'] ) ) {
			return array( 'action' => 'unchanged' );
		}
		return array(
			'action'  => 'update',
			'id'      => (string) ( $cname['id'] ?? '' ),
			'content' => $target,
		);
	}

	/**
	 * The value to write over an existing record of the same kind, keeping what others put there.
	 *
	 * @param string $current Existing value.
	 * @param string $value   Value we want.
	 * @param string $purpose Record purpose.
	 * @return string|null Null when an SPF merge would go over the lookup limit.
	 */
	private static function merged_value( $current, $value, $purpose ) {
		if ( 'spf' === $purpose ) {
			$merged = (string) Dns_Check::spf_suggestion( $current )['value'];
			return Dns_Check::spf_lookups( $merged ) >= self::SPF_LOOKUP_LIMIT ? null : $merged;
		}
		if ( 'lockdown' === $purpose ) {
			// A host may already allow its own sending here; add our auth tokens rather than replacing theirs.
			$merged = $current;
			foreach ( preg_split( '/\s+/', trim( $value ) ) as $part ) {
				if ( 0 === stripos( $part, 'auth=' ) && ! preg_match( '/(^|\s)' . preg_quote( $part, '/' ) . '(\s|$)/i', $merged ) ) {
					$merged .= ' ' . $part;
				}
			}
			return $merged;
		}
		return $value;
	}

	/**
	 * A TXT record's text as Cloudflare returns it, without quotes or string splits.
	 *
	 * @param string $content Content.
	 * @return string
	 */
	private static function txt_content( $content ) {
		$content = trim( $content );
		if ( strlen( $content ) >= 2 && '"' === $content[0] && '"' === substr( $content, -1 ) ) {
			$content = (string) preg_replace( '/"\s+"/', '', substr( $content, 1, -1 ) );
		}
		return $content;
	}

	/**
	 * A value with whitespace collapsed, for comparison.
	 *
	 * @param string $value Value.
	 * @return string
	 */
	private static function compact( $value ) {
		return strtolower( (string) preg_replace( '/\s+/', ' ', trim( $value ) ) );
	}

	/**
	 * Mark a record result as failed with a plain reason.
	 *
	 * @param array $result Record result.
	 * @return array
	 */
	private static function failed( array $result ) {
		$result['action'] = 'failed';
		$result['error']  = __( 'Cloudflare didn’t accept this record. Add it yourself instead.', 'jetpack-send-pkg' );
		return $result;
	}

	/**
	 * Whether an error means no record can be written with this token right now.
	 *
	 * @param WP_Error $error Error from request().
	 * @return bool
	 */
	private static function stops_everything( WP_Error $error ) {
		return in_array(
			$error->get_error_code(),
			array( 'jetpack_send_cloudflare_bad_token', 'jetpack_send_cloudflare_forbidden', 'jetpack_send_cloudflare_rate_limited' ),
			true
		);
	}

	/**
	 * Call the Cloudflare API.
	 *
	 * The token travels only in the Authorization header. Errors carry our own wording, never
	 * Cloudflare's text or anything from the request.
	 *
	 * @param string     $token  Token.
	 * @param string     $method HTTP method.
	 * @param string     $path   Path under API_BASE, with any query string.
	 * @param array|null $body   JSON body.
	 * @return array|WP_Error The decoded envelope on success.
	 */
	private static function request(
		// phpcs:ignore PHPCompatibility.Attributes.NewAttributes.PHPNativeAttributeFound -- Hides the token from stack traces on PHP 8.2+; a comment on older PHP.
		#[\SensitiveParameter]
		$token,
		$method,
		$path,
		$body = null
	) {
		$args = array(
			'method'      => $method,
			'timeout'     => self::TIMEOUT,
			'redirection' => 0,
			'headers'     => array(
				'Authorization' => 'Bearer ' . $token,
				'Content-Type'  => 'application/json',
				'Accept'        => 'application/json',
			),
		);
		if ( null !== $body ) {
			$args['body'] = wp_json_encode( $body, JSON_UNESCAPED_SLASHES );
		}

		$response = wp_remote_request( self::API_BASE . $path, $args );
		if ( is_wp_error( $response ) ) {
			return self::error( 'error' );
		}

		$code     = (int) wp_remote_retrieve_response_code( $response );
		$envelope = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		$envelope = is_array( $envelope ) ? $envelope : array();
		$codes    = array_map( 'intval', array_column( array_filter( (array) ( $envelope['errors'] ?? array() ), 'is_array' ), 'code' ) );

		if ( 429 === $code || in_array( 971, $codes, true ) ) {
			return self::error( 'rate_limited' );
		}
		if ( 401 === $code || array_intersect( $codes, self::BAD_TOKEN_CODES ) ) {
			return self::error( 'bad_token' );
		}
		if ( 403 === $code || in_array( 10000, $codes, true ) ) {
			return self::error( 'forbidden' );
		}
		if ( $code < 200 || $code >= 300 || empty( $envelope['success'] ) ) {
			return self::error( 'error' );
		}
		return $envelope;
	}

	/**
	 * A plain error for the UI. Messages never include the token or Cloudflare's own text.
	 *
	 * @param string $kind   `bad_token`, `no_zone`, `too_broad`, `forbidden`, `rate_limited` or `error`.
	 * @param string $domain Sending domain, for `no_zone` and `too_broad`.
	 * @return WP_Error
	 */
	private static function error( $kind, $domain = '' ) {
		switch ( $kind ) {
			case 'bad_token':
				return new WP_Error( 'jetpack_send_cloudflare_bad_token', __( 'Cloudflare didn’t accept that key. Copy it again and paste the whole thing.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
			case 'no_zone':
				return new WP_Error(
					'jetpack_send_cloudflare_no_zone',
					sprintf(
						/* translators: %s: the sending domain, e.g. example.com. */
						__( 'This key can’t see %s. Make sure you picked it when you created the key, in the Cloudflare account that manages it.', 'jetpack-send-pkg' ),
						$domain
					),
					array( 'status' => 400 )
				);
			case 'too_broad':
				return new WP_Error(
					'jetpack_send_cloudflare_too_broad',
					sprintf(
						/* translators: %s: the sending domain, e.g. example.com. */
						__( 'This key can change more than %1$s. Create one for %1$s only.', 'jetpack-send-pkg' ),
						$domain
					),
					array( 'status' => 400 )
				);
			case 'forbidden':
				return new WP_Error( 'jetpack_send_cloudflare_forbidden', __( 'This key isn’t allowed to change records. Create a new one with the “Edit zone DNS” template.', 'jetpack-send-pkg' ), array( 'status' => 403 ) );
			case 'rate_limited':
				return new WP_Error( 'jetpack_send_cloudflare_rate_limited', __( 'Cloudflare asked us to slow down. Try again in a few minutes.', 'jetpack-send-pkg' ), array( 'status' => 429 ) );
			default:
				return new WP_Error( 'jetpack_send_cloudflare_error', __( 'We couldn’t reach Cloudflare. Try again in a minute.', 'jetpack-send-pkg' ), array( 'status' => 502 ) );
		}
	}
}
