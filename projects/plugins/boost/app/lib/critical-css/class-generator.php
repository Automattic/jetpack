<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\CSS_Proxy;

class Generator {

	const GENERATE_QUERY_ACTION = 'jb-generate-critical-css';

	const BLOCKED_HEADER = 'X-Jetpack-Boost-Generation-Blocked';

	public static function init() {
		$generator = new static();
		if ( static::is_generating_critical_css() ) {
			add_action( 'wp_head', array( $generator, 'display_generate_meta' ), 0 );
			add_filter( 'wp_redirect', array( $generator, 'prevent_login_redirect' ), PHP_INT_MAX );
			$generator->force_logged_out_render();
		}
	}

	/**
	 * Force the current page to render as viewed by a logged out user. Useful when generating
	 * Critical CSS.
	 */
	private function force_logged_out_render() {
		$current_user_id = get_current_user_id();

		if ( 0 !== $current_user_id ) {
			// Force current user to 0 to ensure page is rendered as a non-logged-in user.
			wp_set_current_user( 0 );

			// Turn off display of admin bar.
			add_filter( 'show_admin_bar', '__return_false', PHP_INT_MAX );
		}
	}

	/**
	 * Terminate generation requests that redirect to the login page.
	 *
	 * @since $$next-version$$
	 *
	 * @param string|false $location The path or URL to redirect to.
	 * @return string|false
	 */
	public function prevent_login_redirect( $location ) {
		if ( ! is_string( $location ) ) {
			return $location;
		}

		$targets = array( self::normalize_url( $location ) );

		// A location starting with `//` is protocol-relative, but treat `//wp-login.php` as the login
		// page too: failing closed here only ever ends a generation request.
		if ( 0 === strpos( $location, '//' ) ) {
			$targets[] = self::normalize_url( '/' . ltrim( $location, '/' ) );
		}

		foreach ( array( wp_login_url(), site_url( 'wp-login.php', 'login' ) ) as $login_url ) {
			$login = self::normalize_url( $login_url );

			// A filter can return an empty or path-less login URL. Matching on "/" alone would block
			// every root-bound redirect, but a root path carrying the login's own query is still usable.
			if ( ! is_array( $login ) || ( '/' === $login['path'] && ! $login['query'] ) ) {
				continue;
			}

			foreach ( $targets as $target ) {
				if ( is_array( $target ) && self::is_same_endpoint( $target, $login ) ) {
					$this->send_login_blocked_response();
				}
			}
		}

		return $location;
	}

	/**
	 * End a generation request that would otherwise be sent to the login page.
	 *
	 * The header lets the dashboard tell this apart from any other 403 and name the real cause.
	 */
	private function send_login_blocked_response() {
		if ( ! headers_sent() ) {
			header( self::BLOCKED_HEADER . ': login-required' );
		}

		wp_die(
			esc_html__( 'Critical CSS cannot be generated for a page that requires login.', 'jetpack-boost' ),
			'',
			array( 'response' => 403 )
		);
	}

	/**
	 * Whether a redirect target and the login URL address the same endpoint.
	 *
	 * HTTP and HTTPS count as the same endpoint: a site behind a TLS-terminating proxy can redirect
	 * to either scheme. A relative target carries no host, and matches on path alone.
	 *
	 * @param array $target Normalized redirect target.
	 * @param array $login  Normalized login URL.
	 * @return bool
	 */
	private static function is_same_endpoint( $target, $login ) {
		if ( '' !== $target['host'] && ( $target['host'] !== $login['host'] || $target['port'] !== $login['port'] ) ) {
			return false;
		}

		if ( $target['path'] !== $login['path'] ) {
			return false;
		}

		// The login URL's own parameters must all be present: a custom login endpoint can be a query
		// parameter on an ordinary page. Extra parameters such as reauth or redirect_to are fine.
		foreach ( $login['query'] as $key => $value ) {
			if ( ! array_key_exists( $key, $target['query'] ) || $target['query'][ $key ] !== $value ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Reduce a URL to the parts an endpoint comparison can trust.
	 *
	 * Redirects reach this filter in many shapes, so the path is percent-decoded, resolved against the
	 * current request when relative, and stripped of repeated slashes, `.`, `..` and case differences.
	 *
	 * @param string $url URL or path to normalize.
	 * @return array|false
	 */
	private static function normalize_url( $url ) {
		$parts = wp_parse_url( $url );
		if ( ! is_array( $parts ) ) {
			return false;
		}

		$scheme = isset( $parts['scheme'] ) ? strtolower( $parts['scheme'] ) : '';
		$port   = $parts['port'] ?? null;
		if ( ( 'https' === $scheme && 443 === $port ) || ( 'http' === $scheme && 80 === $port ) ) {
			$port = null;
		}

		wp_parse_str( $parts['query'] ?? '', $query );

		return array(
			'host'  => isset( $parts['host'] ) ? strtolower( $parts['host'] ) : '',
			'port'  => $port,
			'path'  => self::normalize_path( $parts['path'] ?? '', isset( $parts['host'] ) ),
			'query' => $query,
		);
	}

	/**
	 * Resolve a URL path to a single canonical form.
	 *
	 * @param string $path     Path to normalize.
	 * @param bool   $has_host Whether the URL the path came from named a host.
	 * @return string
	 */
	private static function normalize_path( $path, $has_host ) {
		$path = rawurldecode( $path );

		if ( '' === $path ) {
			return '/';
		}

		// A path with no leading slash is relative to the requested directory, the way a browser reads it.
		if ( '/' !== $path[0] ) {
			if ( $has_host ) {
				$path = '/' . $path;
			} else {
				$request = wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '/', PHP_URL_PATH );
				$request = is_string( $request ) ? $request : '/';
				$path    = substr( $request, 0, (int) strrpos( $request, '/' ) + 1 ) . $path;
			}
		}

		$resolved = array();
		foreach ( explode( '/', $path ) as $segment ) {
			if ( '' === $segment || '.' === $segment ) {
				continue;
			}
			if ( '..' === $segment ) {
				array_pop( $resolved );
				continue;
			}
			$resolved[] = $segment;
		}

		$path = strtolower( '/' . implode( '/', $resolved ) );

		return untrailingslashit( $path ) ? untrailingslashit( $path ) : '/';
	}

	/**
	 * Return true if page is loaded to generate critical CSS
	 *
	 * phpcs:disable WordPress.Security.NonceVerification.Recommended
	 */
	public static function is_generating_critical_css() {
		return isset( $_GET[ self::GENERATE_QUERY_ACTION ] ) && self::is_front_end_page_request();
	}

	/**
	 * Whether this request renders a front-end page, the only place Critical CSS is generated from.
	 *
	 * Generation renders as a logged-out user, so a request carrying the query parameter anywhere else -
	 * wp-admin, wp-login.php, REST - could log an administrator out of a page they merely opened.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	private static function is_front_end_page_request() {
		if ( is_admin() || wp_doing_ajax() || wp_doing_cron() ) {
			return false;
		}

		if ( self::is_rest_request() || ( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST ) || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
			return false;
		}

		$entry_points = array( 'wp-login.php', 'wp-register.php', 'wp-signup.php', 'wp-activate.php', 'wp-trackback.php', 'xmlrpc.php' );

		return ! in_array( $GLOBALS['pagenow'] ?? '', $entry_points, true );
	}

	/**
	 * Whether this request is served by the REST API.
	 *
	 * REST_REQUEST is only defined on parse_request, long after this class is set up on
	 * plugins_loaded, so read the request itself rather than the constant.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	private static function is_rest_request() {
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			return true;
		}

		// A site on plain permalinks reaches the REST API through this query parameter instead.
		if ( isset( $_GET['rest_route'] ) ) {
			return true;
		}

		if ( ! isset( $_SERVER['REQUEST_URI'] ) ) {
			return false;
		}

		// REQUEST_URI is a path, so its query is split off by hand: wp_parse_url() would read a leading
		// "//" as a host. Both sides then go through the same normalization as the login match, so a
		// repeated slash, a dot segment, an encoded slash or a capital letter cannot hide a REST path.
		$request_uri  = esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) );
		$request_path = self::normalize_path( (string) strtok( $request_uri, '?#' ), false );
		$prefix       = rest_get_url_prefix();

		if ( '' === trim( $prefix, '/' ) ) {
			return false;
		}

		// get_rest_url() builds REST URLs from home_url(), and puts the prefix behind index.php on
		// index permalinks. $wp_rewrite does not exist yet, so accept either shape.
		foreach ( array( $prefix, 'index.php/' . $prefix ) as $route ) {
			$rest_path = self::normalize_path( (string) wp_parse_url( home_url( $route, 'relative' ), PHP_URL_PATH ), false );

			if ( '/' === $rest_path ) {
				continue;
			}

			if ( 0 === strpos( trailingslashit( $request_path ), trailingslashit( $rest_path ) ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get a Critical CSS status block, adding in local generation nonces (if applicable).
	 * i.e.: Call this method to supply enough Critical CSS status to kick off local generation,
	 * such as in response to a request-generate API call or during page initialization.
	 */
	public function get_generation_metadata() {
		$status = array();

		// Add a user-bound nonce to use when proxying CSS for Critical CSS generation.
		$status['proxy_nonce'] = wp_create_nonce( CSS_Proxy::NONCE_ACTION );

		return $status;
	}

	/**
	 * Renders a <meta> tag used to verify this is a valid page to generate Critical CSS with.
	 */
	public function display_generate_meta() {
		?>
		<meta name="<?php echo esc_attr( self::GENERATE_QUERY_ACTION ); ?>" content="true"/>
		<?php
	}
}
