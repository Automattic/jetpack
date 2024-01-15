<?php

namespace Automattic\Jetpack_Boost\Admin;

use Automattic\Jetpack_Boost\Data_Sync\Getting_Started_Entry;

/**
 * Handle the configuration constants.
 *
 * This is a global state of Jetpack Boost and passed on to the front-end.
 */
class Config {

	public function init() {
		add_action( 'jetpack_boost_module_status_updated', array( $this, 'on_module_status_change' ), 10, 2 );
	}

	public function constants() {
		$constants = array();

		// Give each module an opportunity to define extra constants.
		return apply_filters( 'jetpack_boost_js_constants', $constants );
	}

	/**
	 * Check for permissions.
	 *
	 * @return bool
	 */
	public function check_for_permissions() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Flag get started as complete if a module is enabled.
	 *
	 * @param string $module Module Slug.
	 * @param bool   $enabled Enabled status.
	 */
	public function on_module_status_change( $module, $status ) {
		if ( $status ) {
			( new Getting_Started_Entry() )->set( false );
		}
	}

	/**
	 * Retrieves custom post types.
	 *
	 * @return array Associative array of custom post types
	 * with their labels as keys and names as values.
	 */
	public static function get_custom_post_types() {
		$post_types = get_post_types(
			array(
				'public'   => true,
				'_builtin' => false,
			),
			false
		);
		unset( $post_types['attachment'] );

		$post_types = array_filter( $post_types, 'is_post_type_viewable' );

		return wp_list_pluck( $post_types, 'label', 'name' );
	}
}
