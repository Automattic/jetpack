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

/**
 * Whether an avatar should be displayed, honoring a "hide default avatar" preference.
 *
 * Gravatar-served images never carry core's `avatar-default` class (core only
 * emits it when no avatar was found, and the Gravatar branch always reports
 * found), so a generated fallback like `d=mm` is indistinguishable from a real
 * avatar by class alone. When hiding defaults, callers must fetch the avatar
 * with Gravatar's `blank` fallback so it can be detected via the `d=blank`
 * param — mirroring the Author List block's long-standing behavior.
 *
 * @param string|false $avatar       Avatar HTML as returned by get_avatar()/coauthors_get_avatar().
 * @param bool         $hide_default Whether default (fallback) avatars should be hidden.
 *
 * @return bool True if the avatar should be displayed.
 */
function is_avatar_displayable( $avatar, $hide_default ) {
	if ( ! $avatar ) {
		return false;
	}
	if ( ! $hide_default ) {
		return true;
	}
	$is_default = false !== strpos( $avatar, 'avatar-default' ) || false !== strpos( $avatar, 'd=blank' );
	return ! $is_default;
}
