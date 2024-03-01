<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

class Request {
	/**
	 * @var Request - The request instance for current request.
	 */
	private static $current_request = null;

	/**
	 * @var string - The normalized path for the current request. This is not sanitized. Only to be used for comparison purposes.
	 */
	private $request_uri = false;

	/**
	 * @var array - The GET parameters and cookies for the current request. Everything considered in the cache key.
	 */
	private $request_parameters;

	/**
	 * Gets the singleton request instance.
	 *
	 * @return Request The instance of the class.
	 */
	public static function current() {
		if ( self::$current_request === null ) {
			self::$current_request = new self(
				// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
				isset( $_SERVER['REQUEST_URI'] ) ? Boost_Cache_Utils::normalize_request_uri( $_SERVER['REQUEST_URI'] ) : false,
				// Set the cookies and get parameters for the current request. Sometimes these arrays are modified by WordPress or other plugins.
				// We need to cache them here so they can be used for the cache key later. We don't need to sanitize them, as they are only used for comparison.
				array(
					'cookies' => $_COOKIE, // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
					'get'     => $_GET,    // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Recommended
				)
			);
		}

		return self::$current_request;
	}

	public function __construct( $uri, $parameters ) {
		$this->request_uri        = $uri;
		$this->request_parameters = $parameters;
	}

	public function get_uri() {
		return $this->request_uri;
	}

	public function get_parameters() {
		return $this->request_parameters;
	}

	/**
	 * Returns true if the current request has a fatal error.
	 *
	 * @return bool
	 */
	private function is_fatal_error() {
		$error = error_get_last();
		if ( $error === null ) {
			return false;
		}

		$fatal_errors = array(
			E_ERROR,
			E_PARSE,
			E_CORE_ERROR,
			E_COMPILE_ERROR,
			E_USER_ERROR,
		);

		return in_array( $error['type'], $fatal_errors, true );
	}

	public function is_url_excluded( $request_uri = '' ) {
		if ( $request_uri === '' ) {
			$request_uri = $this->request_uri;
		}

		$bypass_patterns = Boost_Cache_Settings::get_instance()->get_bypass_patterns();
		$bypass_patterns = apply_filters( 'boost_cache_bypass_patterns', $bypass_patterns );

		$bypass_patterns[] = 'wp-.*\.php';
		foreach ( $bypass_patterns as $expr ) {
			if ( ! empty( $expr ) && preg_match( "~$expr~", $request_uri ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Returns true if the request is cacheable.
	 *
	 * If a request is in the backend, or is a POST request, or is not an
	 * html request, it is not cacheable.
	 * The filter boost_cache_cacheable can be used to override this.
	 *
	 * @return bool
	 */
	public function is_cacheable() {
		if ( ! apply_filters( 'boost_cache_cacheable', $this->request_uri ) ) {
			return false;
		}

		if ( defined( 'DONOTCACHEPAGE' ) ) {
			return false;
		}

		// do not cache post previews or customizer previews
		if ( ! empty( $_GET ) && ( isset( $_GET['preview'] ) || isset( $_GET['customize_changeset_uuid'] ) ) ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Recommended
			return false;
		}

		if ( $this->is_fatal_error() ) {
			return false;
		}

		if ( function_exists( 'is_user_logged_in' ) && is_user_logged_in() ) {
			return false;
		}

		if ( $this->is_404() ) {
			return false;
		}

		if ( $this->is_feed() ) {
			return false;
		}

		if ( $this->is_backend() ) {
			return false;
		}

		if ( $this->is_bypassed_extension() ) {
			return false;
		}

		if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] !== 'GET' ) {
			return false;
		}

		if ( $this->is_url_excluded() ) {
			Logger::debug( 'Url excluded, not cached!' );
			return false;
		}

		$accept_headers = apply_filters( 'boost_accept_headers', array( 'application/json', 'application/activity+json', 'application/ld+json' ) );
		$accept_headers = array_map( 'strtolower', $accept_headers );
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- $accept is checked and set below.
		$accept = isset( $_SERVER['HTTP_ACCEPT'] ) ? strtolower( filter_var( $_SERVER['HTTP_ACCEPT'] ) ) : '';

		if ( $accept !== '' ) {
			foreach ( $accept_headers as $header ) {
				if ( str_contains( $accept, $header ) ) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Returns true if the request appears to be for something with a known file extension that is not
	 * usually HTML. e.g.:
	 * - *.txt (including robots.txt, license.txt)
	 * - *.ico (favicon.ico)
	 * - *.jpg, *.png, *.webm (image files).
	 */
	public function is_bypassed_extension() {
		$file_extension = pathinfo( $this->request_uri, PATHINFO_EXTENSION );

		return in_array(
			$file_extension,
			array(
				'txt',
				'ico',
				'jpg',
				'jpeg',
				'png',
				'webp',
				'gif',
			),
			true
		);
	}

	/**
	 * Returns true if the current request is one of the following:
	 * 1. wp-admin
	 * 2. wp-login.php, xmlrpc.php or wp-cron.php/cron request
	 * 3. WP_CLI
	 * 4. REST request.
	 *
	 * @return bool
	 */
	public function is_backend() {

		$is_backend = is_admin();
		if ( $is_backend ) {
			return $is_backend;
		}

		$script = isset( $_SERVER['PHP_SELF'] ) ? basename( $_SERVER['PHP_SELF'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		if ( $script !== 'index.php' ) {
			if ( in_array( $script, array( 'wp-login.php', 'xmlrpc.php', 'wp-cron.php' ), true ) ) {
				$is_backend = true;
			}
		}

		if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
			$is_backend = true;
		}

		if ( PHP_SAPI === 'cli' || ( defined( 'WP_CLI' ) && constant( 'WP_CLI' ) ) ) {
			$is_backend = true;
		}

		if ( defined( 'REST_REQUEST' ) ) {
			$is_backend = true;
		}

		return $is_backend;
	}

	/**
	 * "Safe" version of WordPress' is_404 method. When called before WordPress' query is run, returns
	 * `null` (a falsey value) instead of outputting a _doing_it_wrong warning.
	 */
	public function is_404() {
		global $wp_query;

		if ( ! isset( $wp_query ) || ! function_exists( '\is_404' ) ) {
			return null;
		}

		return \is_404();
	}

	/**
	 * "Safe" version of WordPress' is_feed method. When called before WordPress' query is run, returns
	 * `null` (a falsey value) instead of outputting a _doing_it_wrong warning.
	 */
	public function is_feed() {
		global $wp_query;

		if ( ! isset( $wp_query ) || ! function_exists( '\is_feed' ) ) {
			return null;
		}

		return \is_feed();
	}
}
