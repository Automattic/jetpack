<?php

require_once __DIR__ . '/cache.php';

class Boost_File_Cache extends Boost_Cache {
	private $path;
	private $cache_file;

	public function __construct() {
		parent::__construct();
		error_log( 'request_uri: ' . $this->request_uri ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( 'sanitize_path: ' . $this->sanitize_path( $this->request_uri ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		$this->path       = WP_CONTENT_DIR . '/boost-cache/cache' . parse_url( $this->sanitize_path( $this->request_uri ), PHP_URL_PATH ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
		$this->cache_file = $this->path . $this->key() . '.php';
	}

	public function sanitize_path( $path ) {
		$path = str_replace( '/', DIRECTORY_SEPARATOR, $path );
		$path = preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', $path );
		$path = str_replace( array( '//', '..' ), array( '/', '' ), $path );
		return $path;
	}

	public function get() {
		if ( ! $this->is_cacheable() ) {
			return false;
		}

		if ( file_exists( $this->cache_file ) ) {
			error_log( 'got cache from ' . $this->cache_file . ' for ' . $this->request_uri ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, WordPress.Security.EscapeOutput.OutputNotEscaped
			echo file_get_contents( $this->cache_file ) . '<!-- cached -->';
			die();
		}
		return false;
	}

	private function createCacheDirectory( $path ) {
		if ( ! is_dir( $path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.dir_mkdir_dirname, WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
			mkdir( $path, 0755, true );
		}
	}

	public function set( $data ) {
		if ( ! $this->is_cacheable() ) {
			return false;
		}

		error_log( 'saving: ' . $this->path . ' for ' . $this->request_uri ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		$this->createCacheDirectory( dirname( $this->cache_file ) );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $this->cache_file, $data );
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- cached page that has already been escaped
		echo $data;
		die();
	}

	public function ob_start() {
		if ( ! $this->is_cacheable() ) {
			return false;
		}

		ob_start( array( $this, 'set' ) );
	}
}

$boost_cache = new Boost_File_Cache();
if ( ! $boost_cache->get() ) {
	$boost_cache->ob_start();
}
