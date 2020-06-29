<?php // phpcs:ignore
/**
 * Module Name: External Media
 * Module Description: Jetpack’s External Media integrates Google Photos and Pexels free photos into your image blocks.
 * Sort Order: 28
 * Recommendation Order: 10
 * First Introduced: 8.7
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Recommended
 * Feature: Media
 * Additional Search Queries:
 */

/**
 * Class Jetpack_External_Media.
 */
class Jetpack_External_Media {
	/**
	 * Module slug.
	 *
	 * @var string
	 */
	public $module = 'external-media';

	/**
	 * Jetpack_External_Media constructor.
	 */
	public function __construct() {
		add_action( 'jetpack_activate_module_external-media', array( $this, 'activate_module' ) );
		add_action( 'jetpack_deactivate_module_external-media', array( $this, 'deactivate_module' ) );
		add_action( 'jetpack_register_gutenberg_extensions', array( $this, 'register_extension' ) );
	}

	/**
	 * Activates module.
	 */
	public function activate_module() {
		\Jetpack_Gutenberg::set_extension_available( $this->module );
	}

	/**
	 * Deactivates module.
	 */
	public function deactivate_module() {
		\Jetpack_Gutenberg::set_extension_unavailable( $this->module, 'missing_module' );
	}

	/**
	 * Registers extension.
	 */
	public function register_extension() {
		$is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;

		if ( $is_wpcom || Jetpack::is_module_active( $this->module ) ) {
			$this->activate_module();
		} else {
			$this->deactivate_module();
		}
	}
}
