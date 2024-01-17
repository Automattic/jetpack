<?php

require_once __DIR__ . '/cache.php';

class Boost_File_Cache extends Boost_Cache {
	private $path           = false;
	private $cache_filename = false;

	public function __construct() {
		parent::__construct();
		error_log( 'request_uri: ' . $this->request_uri ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}

	private function calculate_path( $request_uri ) {
		$key  = md5( $request_uri );
		$path = WP_CONTENT_DIR . DIRECTORY_SEPARATOR . 'boost-cache' . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR;
		for ( $i = 0; $i <= 5; $i++ ) {
			$path .= substr( $key, $i, 1 ) . DIRECTORY_SEPARATOR;
		}

		return $path;
	}

	private function path( $request_uri = false ) {
		if ( $request_uri !== false ) {
			return $this->calculate_path( $request_uri );
		}
		if ( $this->path === false ) {
			$this->path = $this->calculate_path( $this->request_uri );
		}
		return $this->path;
	}

	private function cache_filename() {
		if ( $this->cache_filename === false ) {
			$this->cache_filename = $this->path() . $this->cache_key() . '.php';
		}
		return $this->cache_filename;
	}

	public function get() {
		if ( ! $this->is_cacheable() ) {
			return false;
		}

		if ( file_exists( $this->cache_filename() ) ) {
			error_log( 'got cache from ' . $this->cache_filename() . ' for ' . $this->request_uri ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, WordPress.Security.EscapeOutput.OutputNotEscaped
			echo file_get_contents( $this->cache_filename() ) . '<!-- cached -->';
			die();
		}
		return false;
	}

	private function create_cache_directory( $path ) {
		if ( ! is_dir( $path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.dir_mkdir_dirname, WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
			mkdir( $path, 0755, true );
		}
	}

	public function set( $data ) {
		if ( ! $this->is_cacheable() ) {
			return false;
		}

		error_log( 'saving: ' . $this->cache_filename() . ' for ' . $this->request_uri ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		$this->create_cache_directory( dirname( $this->cache_filename() ) );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		file_put_contents( $this->cache_filename(), $data );
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
