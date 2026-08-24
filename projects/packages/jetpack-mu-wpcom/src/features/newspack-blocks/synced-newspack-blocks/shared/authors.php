<?php
/**
 * Helper functions to fetch authors.
 *
 * @package Newspack_Blocks
 */

namespace Newspack_Blocks;

/**
 * Get a list of user roles on this site that have the edit_posts capability.
 *
 * @return array List of roles with edit_posts capability. Each array item is an array with a slug and label property.
 */
function get_authors_roles() {
	global $wp_roles;

	$editable_roles = [];

	foreach ( $wp_roles->roles as $role_slug => $role ) {
		if ( isset( $role['capabilities'] ) && isset( $role['capabilities']['edit_posts'] ) && $role['capabilities']['edit_posts'] ) {
			$editable_roles[] = [
				'slug'  => $role_slug,
				'label' => $role['name'],
			];
		}
	}

	/**
	 * Deprecated filter.
	 *
	 * @param array $editable_roles Array of editable role names as registered via add_role.
	 *
	 * @deprecated Use the newspack_blocks_authors_roles filter instead.
	 * @return array Filtered array of roles.
	 */
	$editable_roles = apply_filters( 'newspack_blocks_author_list_editable_roles', $editable_roles );

	/**
	 * Filter the array of editable roles so other plugins can add/remove as needed.
	 * The array should be a flat array of the name of each role as registered via add_role.
	 * https://developer.wordpress.org/reference/functions/add_role/
	 *
	 * @param array $editable_roles Array of roles that can edit posts. Each array item is an array with a slug and label property.
	 *
	 * @return array Filtered array of roles.
	 */
	return apply_filters( 'newspack_blocks_authors_roles', $editable_roles );
}

/**
 * Get a list of user roles on this site that have the edit_posts capability.
 *
 * @return string[] List of roles with edit_posts capability.
 */
function get_authors_roles_slugs() {
	return array_map(
		function( $role ) {
			return $role['slug'];
		},
		get_authors_roles()
	);
}
