<?php

namespace Automattic\Jetpack_Boost\Lib;

class Post_Types {
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
