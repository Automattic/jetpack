<?php

class Boost_Cache {
	private $cache_key     = false;
	private $path_key      = false;
	protected $request_uri = false;

	public function __construct() {
		$this->request_uri = isset( $_SERVER['REQUEST_URI'] )
			? $_SERVER['REQUEST_URI'] // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			: false;

		add_action( 'wp', array( $this, 'sanitize' ), 0 );
	}

	/*
	 * Sanitize the request_uri.
	 *
	 * This is called on the wp action, because sanitization functions are not available before that.
	 */
	public function sanitize() {
		if ( ! $this->request_uri ) {
			return;
		}

		$this->request_uri = esc_url_raw( wp_unslash( $this->request_uri ) );
	}

	/*
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

		if ( $this->is_backend() ) {
			error_log( "not caching a backend request: {$this->request_uri}" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return false;
		}

		if ( ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] === 'POST' ) ) {
			error_log( "not caching a POST request: {$this->request_uri}" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return false;
		}

		if ( isset( $_SERVER['HTTP_ACCEPT'] ) && strpos( $_SERVER['HTTP_ACCEPT'], 'text/html' ) === false ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			error_log( "not caching a non-html request: {$this->request_uri}" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return false;
		}

		return true;
	}

	/*
	 * Returns a key to identify the visitor's cache file.
	 * It is based on the REQUEST_URI, the cookies and the page GET parameters.
	 *
	 * @param string $request_uri (optional) The request uri to use to calculate the cache key. Defaults to the current request uri.
	 *
	 * @return string
	 */
	private function calculate_cache_key( $request_uri = '' ) {
		if ( $request_uri === '' ) {
			$request_uri = $this->request_uri;
		}
		$cookies = isset( $_COOKIE ) ? $_COOKIE : array();
		$get     = isset( $_GET ) ? $_GET : array(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$key_components = apply_filters(
			'boost_cache_key_components',
			array(
				'cookies'     => $cookies,
				'request_uri' => $request_uri,
				'get'         => $get,
			)
		);

		return md5( json_encode( $key_components ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
	}

	/*
	 * Returns a key to identify the visitor's cache file.
	 * It uses calculate_cache_key() to calculate the key.
	 * Without a parameter, it will use the current request uri, and cache that
	 * value in $this->cache_key.
	 *
	 * @param string $request_uri (optional) The request uri to use to calculate the cache key. Defaults to the current request uri.
	 * @return string
	 */
	public function cache_key( $request_uri = '' ) {
		if ( $request_uri !== '' ) {
			return $this->calculate_cache_key( $request_uri );
		}

		if ( ! $this->cache_key ) {
			$this->cache_key = $this->calculate_cache_key();
		}
		return $this->cache_key;
	}

	/*
	 * Returns a key to identify the path to the visitor's cache file.
	 * Without a parameter it uses the current request uri, and caches that in
	 * $this->path_key.
	 *
	 * @param string $request_uri (optional) The request uri to use to calculate the path key. Defaults to the current request uri.
	 * @return string
	 */
	public function path_key( $request_uri = '' ) {
		if ( $request_uri !== '' ) {
			return md5( $request_uri );
		}

		if ( ! $this->path_key ) {
			$this->path_key = md5( $this->request_uri );
		}
		return $this->path_key;
	}

	public function get() {
		return false;
	}

	public function set( $data ) {
		echo esc_html( $data );
		return false;
	}

	public function ob_start() {
		return false;
	}

	/*
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
			} elseif ( defined( 'DOING_CRON' ) && DOING_CRON ) {
				$is_backend = true;
			} elseif ( PHP_SAPI === 'cli' || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
				$is_backend = true;
			}
		} elseif ( defined( 'REST_REQUEST' ) ) {
			$is_backend = true;
		}

		return $is_backend;
	}
}
