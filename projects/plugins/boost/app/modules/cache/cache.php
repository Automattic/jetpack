<?php

class Boost_Cache {
	private $key           = false;
	protected $request_uri = false;

	public function __construct() {
		$this->key();
		$this->request_uri = isset( $_SERVER['REQUEST_URI'] )
			? $_SERVER['REQUEST_URI'] // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			: false;

		add_action( 'wp', array( $this, 'sanitize' ), 0 );
	}

	public function sanitize() {
		if ( ! $this->request_uri ) {
			return;
		}

		$this->request_uri = esc_url_raw( wp_unslash( $this->request_uri ) );
	}

	public function is_cacheable() {
		if ( $this->is_backend() ) {
			error_log( "not caching a backend request: {$this->request_uri}" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return false;
		}

		if ( ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] === 'POST' ) ) {
			error_log( "not caching a POST request: {$this->request_uri}" ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return false;
		}

		return apply_filters( 'boost_cache_cacheable', $this->request_uri );
	}

	public function key() {
		if ( ! $this->key ) {
			$cookies = isset( $_COOKIE ) ? $_COOKIE : array();
			$request = isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : array(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			$get     = isset( $_GET ) ? $_GET : array(); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

			$key_components = apply_filters(
				'boost_cache_key_components',
				array(
					'cookies' => $cookies,
					'request' => $request,
					'get'     => $get,
				)
			);

			$this->key = md5( json_encode( $key_components ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
		}
		return $this->key;
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
