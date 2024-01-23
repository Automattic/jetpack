<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

abstract class Boost_Cache {
	/*
	 * @var string - The path key used to identify the cache directory for the current request. MD5 of the request uri.
	 */
	protected $path_key = false;

	/*
	 * @var string - The sanitized path for the current request.
	 */
	protected $request_uri = false;

	public function __construct() {
		$this->request_uri = isset( $_SERVER['REQUEST_URI'] )
			? $this->sanitize_request_uri( $_SERVER['REQUEST_URI'] ) // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
			: false;
	}

	/*
	 * Serve the cached page if it exists, otherwise start output buffering.
	 */
	public function serve() {
		if ( ! $this->get() ) {
			$this->ob_start();
		}
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
			return false;
		}

		if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] === 'POST' ) {
			return false;
		}

		if ( isset( $_SERVER['HTTP_ACCEPT'] ) && strpos( $_SERVER['HTTP_ACCEPT'], 'text/html' ) === false ) { // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			return false;
		}

		return true;
	}

	/*
	 * copy of _deep_replace() to be used before WordPress loads
	 * @see https://developer.wordpress.org/reference/functions/_deep_replace/
	 */
	private function deep_replace( $search, $subject ) {
		$subject = (string) $subject;

		$count = 1;
		while ( $count ) {
			$subject = str_replace( $search, '', $subject, $count );
		}

		return $subject;
	}

	/*
	 * Sanitize the request uri so it can be used for caching purposes.
	 * It removes the query string and the trailing slash, and characters
	 * that might cause problems with the filesystem.
	 *
	 * @param string $request_uri - The request uri to sanitize.
	 * @return string - The sanitized request uri.
	 */
	protected function sanitize_request_uri( $request_uri ) {
		// get path from request uri
		$request_uri = parse_url( $request_uri, PHP_URL_PATH ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
		if ( $request_uri === '' ) {
			$request_uri = '/';
		} elseif ( substr( $request_uri, -1 ) !== '/' ) {
			$request_uri .= '/';
		}

		$request_uri = $this->deep_replace(
			array( '..', '\\' ),
			preg_replace(
				'/[ <>\'\"\r\n\t\(\)]/',
				'',
				preg_replace(
					'/(\?.*)?(#.*)?$/',
					'',
					$request_uri
				)
			)
		);

		return $request_uri;
	}

	/*
	 * Returns a key to identify the visitor's cache file from the request uri,
	 * cookies and get parameters.
	 * Without a parameter, it will use the current request uri.
	 *
	 * @param array $args (optional) An array containing the request uri, cookies and get parameters to calculate the cache key. Defaults to the current request uri, cookies and get parameters.
	 * @return string
	 */
	public function cache_key( $args = array() ) {
		if ( isset( $args['request_uri'] ) ) {
			$args['request_uri'] = $this->sanitize_request_uri( $args['request_uri'] );
		}

		$defaults = array(
			'request_uri' => $this->request_uri,
			'cookies'     => $_COOKIE, // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			'get'         => $_GET, // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.NonceVerification.Recommended
		);
		$args     = array_merge( $defaults, $args );

		$key_components = apply_filters(
			'boost_cache_key_components',
			$args
		);

		return md5( json_encode( $key_components ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
	}

	/*
	 * Returns a key to identify the path to the visitor's cache file.
	 * Without a parameter it uses the current request uri, and caches that in
	 * $this->path_key.
	 * A URL like "/2024/01/01/hello-world/" on your site will have one path_key,
	 * but the cache_filename to identify the cache file for a visitor is based
	 * on the path_key + cache_key. Can have multiple cache files for one path_key.
	 *
	 * @param string $request_uri (optional) The sanitized request uri to calculate the path key. Defaults to the current request uri.
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

	abstract public function get();

	abstract public function set( $data );

	public function ob_start() {
		if ( ! $this->is_cacheable() ) {
			return false;
		}

		ob_start( array( $this, 'set' ) );
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
