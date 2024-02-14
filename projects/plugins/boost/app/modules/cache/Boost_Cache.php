<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

/*
 * This file is loaded by advanced-cache.php, and so cannot rely on autoloading.
 */
require_once __DIR__ . '/Boost_Cache_Settings.php';
require_once __DIR__ . '/Boost_Cache_Utils.php';
require_once __DIR__ . '/Logger.php';
require_once __DIR__ . '/Request.php';
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
	 * @var string - The request object that provides utility for the current request.
	 */
	private $request = null;

	/**
	 * @param $storage - Optionally provide a Boost_Cache_Storage subclass to handle actually storing and retrieving cached content. Defaults to a new instance of File_Storage.
	 */
	public function __construct( $storage = null ) {
		$this->settings = Boost_Cache_Settings::get_instance();
		$this->storage  = $storage ?? new Storage\File_Storage( WP_CONTENT_DIR . '/boost-cache/cache/' );
		$this->request  = new Request();
	}

	/*
	 * Serve the cached page if it exists, otherwise start output buffering.
	 */
	public function serve() {
		if ( ! $this->serve_cached() ) {
			$this->ob_start();
		}
	}

	/**
	 * Serve cached content, if any is available for the current request. Will terminate if it does so.
	 * Otherwise, returns false.
	 */
	public function serve_cached() {
		if ( ! $this->request->is_cacheable() ) {
			return false;
		}

		$cached = $this->storage->read( $this->request->get_uri(), $this->request->get_parameters() );
		if ( is_string( $cached ) ) {
			Logger::request_debug( 'Serving cached page' );
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
		if ( ! $this->request->is_cacheable() ) {
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
		if ( strlen( $buffer ) > 0 && $this->request->is_cacheable() ) {
			$result = $this->storage->write( $this->request->get_uri(), $this->request->get_parameters(), $buffer );

			if ( is_wp_error( $result ) ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedIf
				Logger::request_debug( 'Error writing cache file: ' . $result->get_error_message() );
			} else {
				Logger::request_debug( 'Cache file created' );
			}
		}

		return $buffer;
	}
}
