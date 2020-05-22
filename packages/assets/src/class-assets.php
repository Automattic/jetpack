<?php
/**
 * Jetpack Assets package.
 *
 * @package  automattic/jetpack-assets
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Constants as Jetpack_Constants;

/**
 * Class Assets
 */
class Assets {
	/**
	 * Holds all the scripts handles that should be loaded in an async fashion.
	 *
	 * @var array
	 */
	private $async_script_handles = array();
	/**
	 * The singleton instance of this class.
	 *
	 * @var Assets
	 */
	protected static $instance;

	/**
	 * Constructor.
	 *
	 * Static-only class, so nothing here.
	 */
	private function __construct() {}

	/**
	 * Get the singleton instance of the class.
	 *
	 * @return Assets
	 */
	public static function instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new Assets();
			self::$instance->init_hooks();
		}

		return self::$instance;
	}

	/**
	 * Initalize the hooks as needed.
	 */
	private function init_hooks() {
		/*
		 * Load some scripts asynchronously.
		 */
		add_filter( 'script_loader_tag', array( $this, 'script_add_async' ), 10, 2 );
	}

	/**
	 * A public method for adding the async script.
	 *
	 * @param string $script_handle Script handle.
	 */
	public function add_async_script( $script_handle ) {
		$this->async_script_handles[] = $script_handle;
	}

	/**
	 * Add an async attribute to scripts that can be loaded asynchronously.
	 * https://www.w3schools.com/tags/att_script_async.asp
	 *
	 * @param string $tag    The <script> tag for the enqueued script.
	 * @param string $handle The script's registered handle.
	 */
	public function script_add_async( $tag, $handle ) {
		if ( empty( $this->async_script_handles ) ) {
			return $tag;
		}

		if ( in_array( $handle, $this->async_script_handles, true ) ) {
			return preg_replace( '/^<script /i', '<script async defer ', $tag );
		}

		return $tag;
	}

	/**
	 * Given a minified path, and a non-minified path, will return
	 * a minified or non-minified file URL based on whether SCRIPT_DEBUG is set and truthy.
	 *
	 * Both `$min_base` and `$non_min_base` are expected to be relative to the
	 * root Jetpack directory.
	 *
	 * @since 5.6.0
	 *
	 * @param string $min_path minified path.
	 * @param string $non_min_path non-minified path.
	 * @return string The URL to the file
	 */
	public static function get_file_url_for_environment( $min_path, $non_min_path ) {
		$path = ( Jetpack_Constants::is_defined( 'SCRIPT_DEBUG' ) && Jetpack_Constants::get_constant( 'SCRIPT_DEBUG' ) )
			? $non_min_path
			: $min_path;

		$url = plugins_url( $path, Jetpack_Constants::get_constant( 'JETPACK__PLUGIN_FILE' ) );

		/**
		 * Filters the URL for a file passed through the get_file_url_for_environment function.
		 *
		 * @since 8.1.0
		 *
		 * @package assets
		 *
		 * @param string $url The URL to the file.
		 * @param string $min_path The minified path.
		 * @param string $non_min_path The non-minified path.
		 */
		return apply_filters( 'jetpack_get_file_for_environment', $url, $min_path, $non_min_path );
	}

	/**
	 * A helper function that lets you enqueue scripts in an async fashion.
	 *
	 * @param string $handle        Name of the script. Should be unique.
	 * @param string $min_path      Minimized script path.
	 * @param string $non_min_path  Full Script path.
	 * @param array  $deps           Array of script dependencies.
	 * @param bool   $ver             The script version.
	 * @param bool   $in_footer       Should the script be included in the footer.
	 */
	public static function enqueue_async_script( $handle, $min_path, $non_min_path, $deps = array(), $ver = false, $in_footer = true ) {
		$assets_instance = self::instance();
		$assets_instance->add_async_script( $handle );
		wp_enqueue_script( $handle, self::get_file_url_for_environment( $min_path, $non_min_path ), $deps, $ver, $in_footer );
	}

}
