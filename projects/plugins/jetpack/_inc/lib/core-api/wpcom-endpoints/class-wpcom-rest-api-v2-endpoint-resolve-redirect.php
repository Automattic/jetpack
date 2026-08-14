<?php
/**
 * REST API endpoint for resolving URL redirects.
 *
 * @package automattic/jetpack
 * @since 8.0.0
 */

use Automattic\Jetpack\IP\Utils;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Resolve URL redirects.
 *
 * @since 8.0.0
 */
class WPCOM_REST_API_V2_Endpoint_Resolve_Redirect extends WP_REST_Controller {
	/**
	 * Maximum number of redirect hops to follow before giving up.
	 *
	 * Matches WordPress's default `redirection` limit, so legitimate public
	 * short links keep resolving exactly as before.
	 *
	 * @var int
	 */
	const MAX_REDIRECTS = 5;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'resolve-redirect';
		// This endpoint *does not* need to connect directly to Jetpack sites.
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		// GET /sites/<blog_id>/resolve-redirect/<url> - Follow redirects (any 3xx) on a URL, and return the final destination.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/?(?P<url>.+)?',
			array(
				'args'   => array(
					'url' => array(
						'description'       => __( 'The URL to check for redirects.', 'jetpack' ),
						'type'              => 'string',
						'required'          => true,
						'validate_callback' => array( $this, 'validate_url' ),
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'follow_redirect' ),
					'permission_callback' => 'is_user_logged_in',
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Follows HTTP redirects (any 3xx) for the passed URL, and returns the final destination and status code.
	 *
	 * Each hop is fetched with `redirection => 0` and re-checked with validate_url()
	 * before the next request, so a redirect cannot reach a host the input validation
	 * would reject. Public short links still resolve; only hops that land on a
	 * rejected destination are blocked.
	 *
	 * @param WP_REST_Request $request The REST API request data.
	 * @return WP_REST_Response|WP_Error The resolved destination, or a WP_Error when the URL
	 *                                   could not be fetched, was blocked, or looped past the
	 *                                   redirect limit.
	 */
	public function follow_redirect( $request ) {
		$url  = $request['url'];
		$args = array(
			// Do not let WordPress follow redirects for us; we validate each hop first.
			'redirection' => 0,
			// Add a User-Agent header since the request is sometimes blocked without it.
			'headers'     => array(
				'User-Agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:71.0) Gecko/20100101 Firefox/71.0',
			),
		);

		for ( $hop = 0; $hop <= self::MAX_REDIRECTS; $hop++ ) {
			// Every $url reaching this call has already cleared validate_url():
			// the initial one via the route's validate_callback, redirect hops below.
			$response = wp_safe_remote_get( $url, $args );

			if ( is_wp_error( $response ) ) {
				return $this->request_failed_error();
			}

			$status = (int) wp_remote_retrieve_response_code( $response );

			// No valid HTTP status line (e.g. an empty or malformed response that did not
			// trigger is_wp_error): treat it as a failed fetch, not a status-0 "success".
			if ( $status < 100 ) {
				return $this->request_failed_error();
			}

			// Not a redirect: the final, validated destination.
			if ( $status < 300 || $status >= 400 ) {
				return rest_ensure_response(
					array(
						'url'    => $url,
						'status' => $status,
					)
				);
			}

			$location = wp_remote_retrieve_header( $response, 'location' );

			// Multiple Location headers: follow the last, as core does.
			if ( is_array( $location ) ) {
				$location = end( $location );
			}

			// Location may be relative; resolve it against the current URL.
			$next_url = is_string( $location ) && '' !== $location
				? WP_Http::make_absolute_url( $location, $url )
				: '';

			// A 3xx with no usable Location header is a dead end, not a loop: return the
			// current, already-validated URL. A self-redirect (next === current) is left
			// to loop and is caught below as too_many_redirects, alongside longer loops.
			if ( ! is_string( $next_url ) || '' === $next_url ) {
				return rest_ensure_response(
					array(
						'url'    => $url,
						'status' => $status,
					)
				);
			}

			// Budget exhausted: this hop is a redirect but we may not follow any more
			// (a long chain or a redirect loop). Stop before validating a destination we
			// will never fetch -- no wasted DNS lookup, and the next hop stays unvalidated.
			if ( self::MAX_REDIRECTS === $hop ) {
				break;
			}

			// Re-validate the destination before following the redirect.
			if ( ! $this->validate_url( $next_url ) ) {
				return $this->request_failed_error();
			}

			$url = $next_url;
		}

		// Chain exceeded MAX_REDIRECTS; the next hop was never validated, so fail rather
		// than returning it.
		return new WP_Error(
			'too_many_redirects',
			__( 'The URL exceeded the maximum number of allowed redirects.', 'jetpack' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Builds the WP_Error returned when a URL cannot be fetched or is blocked.
	 *
	 * A rejected destination and a genuine request failure share one generic error
	 * so the endpoint cannot be used as an oracle for which internal hosts exist.
	 *
	 * @return WP_Error
	 */
	private function request_failed_error() {
		return new WP_Error(
			'http_request_failed',
			__( 'The URL could not be resolved.', 'jetpack' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Validates a URL for use as a redirect source or destination.
	 *
	 * Runs core's wp_http_validate_url(), then rejects hosts that resolve to a
	 * reserved or non-public IP core leaves open (cloud-metadata link-local, IPv6
	 * link-local / ULA, CGNAT, and similar). Used as the route's validate_callback
	 * and on every redirect hop.
	 *
	 * Returns a plain boolean rather than a WP_Error so that, as the route's
	 * validate_callback, a rejected URL surfaces as a generic rest_invalid_param
	 * and the endpoint cannot be used to probe which internal hosts exist.
	 *
	 * @param string $url URL to validate.
	 * @return bool True when the URL is safe to request, false otherwise.
	 */
	public function validate_url( $url ) {
		if ( ! wp_http_validate_url( $url ) ) {
			return false;
		}

		$host = wp_parse_url( $url, PHP_URL_HOST );
		if ( ! is_string( $host ) || '' === $host ) {
			return false;
		}

		$ips = $this->resolve_host_ips( $host );

		// A host we cannot resolve to any IP must not be assumed safe: fail closed
		// rather than deferring to the weaker checks in the request layer.
		if ( empty( $ips ) ) {
			return false;
		}

		foreach ( $ips as $ip ) {
			if ( ! Utils::ip_is_public( $ip ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Resolves a host to the list of IP addresses that should be validated.
	 *
	 * IP literals are returned as-is. Host names are resolved to their IPv4 and
	 * IPv6 addresses so every address the request could connect to is checked. An
	 * empty list means resolution failed; callers must treat that as invalid
	 * (fail closed) rather than letting the host through.
	 *
	 * @param string $host Host name or IP literal (IPv6 literals may be bracketed).
	 * @return string[] List of IP addresses.
	 */
	private function resolve_host_ips( $host ) {
		// IPv6 literals arrive bracketed, e.g. "[::1]".
		$host = trim( $host, '[]' );

		// URL-decode so a percent-encoded host (e.g. "169%2e254%2e169%2e254")
		// cannot slip past the IP-literal and DNS checks, then strip any IPv6 zone
		// identifier (e.g. "fe80::1%eth0") -- which only becomes visible once "%25"
		// is decoded to "%".
		$host = rawurldecode( $host );
		if ( false !== strpos( $host, '%' ) ) {
			$host = preg_replace( '/%.*$/', '', $host );
		}

		if ( filter_var( $host, FILTER_VALIDATE_IP ) ) {
			return array( $host );
		}

		$ips = array();

		if ( function_exists( 'gethostbynamel' ) ) {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- gethostbynamel() warns on an unresolvable host.
			$ipv4 = @gethostbynamel( $host );
			if ( is_array( $ipv4 ) ) {
				$ips = $ipv4;
			}
		}

		// gethostbynamel() only resolves IPv4; check AAAA records too. dns_get_record()
		// can be disabled on some hosts and may warn on lookup failure.
		if ( function_exists( 'dns_get_record' ) ) {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- dns_get_record may fail on some systems.
			$aaaa = @dns_get_record( $host, DNS_AAAA );
			if ( is_array( $aaaa ) ) {
				foreach ( $aaaa as $record ) {
					if ( ! empty( $record['ipv6'] ) ) {
						$ips[] = $record['ipv6'];
					}
				}
			}
		}

		return $ips;
	}

	/**
	 * Retrieves the response schema, conforming to JSON Schema.
	 *
	 * @return array
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'resolve-redirect',
			'type'       => 'object',
			'properties' => array(
				'url'    => array(
					'description' => __( 'The final destination of the URL being checked for redirects.', 'jetpack' ),
					'type'        => 'string',
				),
				'status' => array(
					'description' => __( 'The HTTP status code of the resolved URL\'s response. When the URL cannot be fetched, is blocked, or exceeds the redirect limit, the endpoint returns a WP_Error instead.', 'jetpack' ),
					'type'        => 'integer',
				),
			),
		);

		return $schema;
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Resolve_Redirect' );
