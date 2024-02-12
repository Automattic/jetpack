<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

/*
 * This file is loaded by advanced-cache.php, and so cannot rely on autoloading.
 */
require_once __DIR__ . '/Boost_Cache_Settings.php';
require_once __DIR__ . '/Boost_Cache_Utils.php';
require_once __DIR__ . '/Storage/File_Storage.php';

class Boost_Cache {
	/*
	 * @var Boost_Cache_Settings - The settings for the page cache.
	 */
	private $settings;

	/**
	 * @var Boost_Cache_Storage - The storage system used by Boost Cache.
	 */
	private $storage;

	/*
	 * @var string - The normalized path for the current request. This is not sanitized. Only to be used for comparison purposes.
	 */
	private $request_uri = false;

	/*
	 * @var array - The GET parameters and cookies for the current request. Everything considered in the cache key.
	 */
	private $request_parameters;

	/**
	 * @param $storage - Optionally provide a Boost_Cache_Storage subclass to handle actually storing and retrieving cached content. Defaults to a new instance of File_Storage.
	 */
	public function __construct( $storage = null ) {
		$this->settings = Boost_Cache_Settings::get_instance();
		$this->storage  = $storage ?? new Storage\File_Storage( WP_CONTENT_DIR . '/boost-cache/cache/' );

		$this->request_uri = isset( $_SERVER['REQUEST_URI'] )
			? $this->normalize_request_uri( $_SERVER['REQUEST_URI'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			: false;

		/*
		 * Set the cookies and get parameters for the current request.
		 * Sometimes these arrays are modified by WordPress or other plugins.
		 * We need to cache them here so they can be used for the cache key later.
		 * We don't need to sanitize them, as they are only used for comparison.
		 */
		$this->request_parameters = array(
			'cookies' => $_COOKIE, // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			'get'     => $_GET,   // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Recommended
		);
	}

	/*
	 * Serve the cached page if it exists, otherwise start output buffering.
	 */
	public function serve() {
		if ( ! $this->serve_cached() ) {
			$this->ob_start();
		}
	}

	/*
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

		if ( defined( 'DONOTCACHEPAGE' ) ) {
			return false;
		}

		if ( $this->is_fatal_error() ) {
			return false;
		}

		if ( function_exists( 'is_user_logged_in' ) && is_user_logged_in() ) {
			return false;
		}

		if ( function_exists( 'is_404' ) && is_404() ) {
			return false;
		}

		if ( function_exists( 'is_feed' ) && is_feed() ) {
			return false;
		}

		if ( $this->is_backend() ) {
			return false;
		}

		if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] !== 'GET' ) {
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

	/*
	 * Normalize the request uri so it can be used for caching purposes.
	 * It removes the query string and the trailing slash, and characters
	 * that might cause problems with the filesystem.
	 *
	 * **THIS DOES NOT SANITIZE THE VARIABLE IN ANY WAY.**
	 * Only use it for comparison purposes or to generate an MD5 hash.
	 *
	 * @param string $request_uri - The request uri to normalize.
	 * @return string - The normalized request uri.
	 */
	protected function normalize_request_uri( $request_uri ) {
		// get path from request uri
		$request_uri = parse_url( $request_uri, PHP_URL_PATH ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
		if ( $request_uri === '' ) {
			$request_uri = '/';
		} elseif ( substr( $request_uri, -1 ) !== '/' ) {
			$request_uri .= '/';
		}

		return $request_uri;
	}

	/**
	 * Serve cached content, if any is available for the current request. Will terminate if it does so.
	 * Otherwise, returns false.
	 */
	public function serve_cached() {
		if ( ! $this->is_cacheable() ) {
			return false;
		}

		$cached = $this->storage->read( $this->request_uri, $this->request_parameters );
		if ( is_string( $cached ) ) {
			echo $cached . '<!-- cached -->'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			die();
		}

		return false;
	}

	/*
	 * Starts output buffering and sets the callback to save the cache file.
	 *
	 * @return bool - false if page is not cacheable.
	 */
	public function ob_start() {
		if ( ! $this->is_cacheable() ) {
			return false;
		}

		ob_start( array( $this, 'ob_callback' ) );
	}

	/*
	 * Callback function from output buffer. This function saves the output
	 * buffer to a cache file and then returns the buffer so PHP will send it
	 * to the browser.
	 *
	 * @param string $buffer - The output buffer to save to the cache file.
	 * @return string - The output buffer.
	 */
	public function ob_callback( $buffer ) {
		if ( $this->is_cacheable() ) {
			$result = $this->storage->write( $this->request_uri, $this->request_parameters, $buffer );

			if ( is_wp_error( $result ) ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
				// TODO: log error for site owner
			}
		}

		return $buffer;
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
}
