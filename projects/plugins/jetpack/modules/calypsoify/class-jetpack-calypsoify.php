<?php
/**
 * This is Calypso skin of the wp-admin interface that is conditionally triggered via the ?calypsoify=1 param.
 *
 * @deprecated 13.6 Use Automattic\Jetpack\Calypsoify instead.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Calypsoify\Jetpack_Calypsoify as Calypsoify;

/**
 * Class Jetpack_Calypsoify
 *
 * @deprecated 13.6
 */
class Jetpack_Calypsoify extends Calypsoify {

	/**
	 * Is Calypsoify enabled, based on any value of `calypsoify` user meta.
	 *
	 * @deprecated 13.6
	 *
	 * @var bool
	 */
	public $is_calypsoify_enabled = false;

	/**
	 * Jetpack_Calypsoify constructor.
	 */
	private function __construct() {
	}

	/**
	 * Singleton.
	 *
	 * @deprecated 13.6
	 *
	 * @return Calypsoify
	 */
	public static function get_instance() {
		_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Calypsoify\\Jetpack_Calypsoify::get_instance' );
		return parent::get_instance();
	}

	/**
	 * Setup function that is loaded on the `wp_loaded` hook via the constructor.
	 *
	 * @deprecated 13.6
	 */
	public function setup() {
		_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Calypsoify\\Jetpack_Calypsoify::setup' );
		return parent::setup();
	}

	/**
	 * Enqueues scripts, data, and styles for Gutenberg.
	 *
	 * @deprecated 13.6
	 */
	public function enqueue_for_gutenberg() {
		_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Calypsoify\\Jetpack_Calypsoify::enqueue_for_gutenberg' );
		return parent::enqueue_for_gutenberg();
	}

	/**
	 * Returns the Calypso URL that displays either the current post type list (if no args
	 * are supplied) or the classic editor for the current post (if a post ID is supplied).
	 *
	 * @deprecated 13.6
	 *
	 * @param int|null $post_id Post ID.
	 *
	 * @return string
	 */
	public function get_calypso_url( $post_id = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- in process of deprecating hence unused parameter.
		_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Calypsoify\\Jetpack_Calypsoify::get_calypso_url' );
		return parent::get_calypso_url( $post_id );
	}

	/**
	 * Returns the URL to be used on the block editor close button for going back to the
	 * Calypso post list.
	 *
	 * @deprecated 13.6
	 *
	 * @return string
	 */
	public function get_close_gutenberg_url() {
		_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Calypsoify\\Jetpack_Calypsoify::get_close_gutenberg_url' );
		return parent::get_close_gutenberg_url();
	}

	/**
	 * Returns the URL for switching the user's editor to the Calypso (WordPress.com Classic) editor.
	 *
	 * @deprecated 13.6
	 *
	 * @return string
	 */
	public function get_switch_to_classic_editor_url() {
		_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Calypsoify\\Jetpack_Calypsoify::get_switch_to_classic_editor_url' );
		return parent::get_switch_to_classic_editor_url();
	}

	/**
	 * Checks if the calypsoify user meta value is set, and deletes it if it is.
	 * This is to ensure that Calypsoify is not activated without the URL parameter.
	 *
	 * @deprecated 13.6
	 */
	public function check_meta() {
		_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Calypsoify\\Jetpack_Calypsoify::check_meta' );
		return parent::check_meta();
	}

	/**
	 * Return whether a post type should display the Gutenberg/block editor.
	 *
	 * @deprecated 13.6
	 *
	 * @since 6.7.0
	 *
	 * @param string $post_type Post type.
	 */
	public function is_post_type_gutenberg( $post_type ) { // phpcs:ignore  VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- in process of deprecating hence unused parameter.
		_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Calypsoify\\Jetpack_Calypsoify::is_post_type_gutenberg' );
		return parent::is_post_type_gutenberg( $post_type );
	}

	/**
	 * Determines if the page is an instance of the Gutenberg block editor.
	 *
	 * @deprecated 13.6
	 *
	 * @return bool
	 */
	public function is_page_gutenberg() {
		_deprecated_function( __METHOD__, 'jetpack-13.6', 'Automattic\\Jetpack\\Calypsoify\\Jetpack_Calypsoify::is_page_gutenberg' );
		return parent::is_page_gutenberg();
	}
}

Calypsoify::get_instance();
