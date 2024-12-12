<?php
/**
 * Functions that alter the behavior of WP-Admin screens.
 *
 * Added in the context of the Remove Duplicate views Project thread (https://wp.me/pekYwv-4PY).
 *
 * @todo: Move the remaining code for duplicate reviews from wpcom-admin-interface.php
 */

declare( strict_types=1 );

/**
 * Get the preferred configured view for a given post type.
 *
 * @param string $post_type The post type.
 * @return mixed|null
 */
function wpcom_get_preferred_configured_view( string $post_type ) {
	remove_filter( 'get_user_option_jetpack_admin_menu_preferred_views', 'wpcom_admin_get_user_option_jetpack' );
	$option = get_user_option( 'jetpack_admin_menu_preferred_views' );
	add_filter( 'get_user_option_jetpack_admin_menu_preferred_views', 'wpcom_admin_get_user_option_jetpack' );

	return $option[ $post_type ] ?? null;
}

/**
 * Update the editor edit link in the edit.php screen to point to Calypso iframe for users that have the remove duplicate experiment enabled.
 *
 * This is a temporary solution until we remove the iFramed Editor.
 *
 * @param string $link    The original link.
 * @param int    $post_id The post id
 * @return mixed|string
 */
function wpcom_update_editor_edit_link_in_edit_page_when_experiment_enabled( $link, $post_id ) {
	global $pagenow, $post_type;

	if ( 'edit.php' !== $pagenow ) {
		return $link;
	}

	$post_slug_list = array(
		'post',
		'page',
		'jetpack-testimonial',
		'jetpack-portfolio',
	);

	if ( ! in_array( $post_type, $post_slug_list, true ) ) {
		return $link;
	}

	// if the user is on the control variation or if they opted for WP-Admin Classic.
	if ( ! wpcom_is_duplicate_views_experiment_enabled() || ! wpcom_is_using_default_admin_menu() ) {
		return $link;
	}

	$preferred_view = wpcom_get_preferred_configured_view( 'edit.php?post_type=' . $post_type );

	if ( null !== $preferred_view ) {
		return $link;
	}

	return 'https://wordpress.com/' . $post_type . '/' . ( new Automattic\Jetpack\Status() )->get_site_suffix() . '/' . $post_id;
}

add_filter( 'get_edit_post_link', 'wpcom_update_editor_edit_link_in_edit_page_when_experiment_enabled', 10, 2 );

/**
 * Set the editor type in the admin menu to the iframe for users that are in the treatment group.
 *
 * When set to classic, the iframe editor will point to Core as before.
 *
 * @param bool   $use_core_editor If the user should get the Core Editor link.
 * @param string $menu_item_slug  The menu item slug - in this case, the edit.php slug
 * @return false|mixed
 */
function wpcom_admin_menu_set_editor_type( $use_core_editor, $menu_item_slug ) {
	$post_slug_list = array(
		'edit-php'                             => 'post',
		'edit-phppost_typepage'                => 'page',
		'edit-phppost_typejetpack-portfolio'   => 'jetpack-portfolio',
		'edit-phppost_typejetpack-testimonial' => 'jetpack-testimonial',
	);

	if ( ! isset( $post_slug_list[ $menu_item_slug ] ) ) {
		return $use_core_editor;
	}

	// bail if the user is on the control variation or if they opted for WP-Admin Classic.
	if ( ! wpcom_is_duplicate_views_experiment_enabled() || ! wpcom_is_using_default_admin_menu() ) {
		return $use_core_editor;
	}

	$preferred_view = wpcom_get_preferred_configured_view( 'edit.php?post_type=' . $post_slug_list[ $menu_item_slug ] );

	if ( null !== $preferred_view ) {
		return $use_core_editor;
	}

	return false;
}

add_filter( 'wpcom_admin_menu_use_core_editor', 'wpcom_admin_menu_set_editor_type', 10, 2 );

/**
 * Use the Calypso editor iframe for users that are part of the treatment variation.
 *
 * @return void
 */
function wpcom_duplicate_views_experiment_update_admin_menu_post_new() {
	if ( ! wpcom_is_duplicate_views_experiment_enabled() || ! wpcom_is_using_default_admin_menu() ) {
		return;
	}

	$domain = ( new Automattic\Jetpack\Status() )->get_site_suffix();

	$admin_menu = Automattic\Jetpack\Masterbar\Admin_Menu::get_instance();
	$admin_menu->update_submenus('edit.php', array( 'post-new.php' => 'https://wordpress.com/post/' . $domain));
	$admin_menu->update_submenus('edit.php?post_type=page', array( 'post-new.php?post_type=page' => 'https://wordpress.com/page/' . $domain));

	$admin_menu->update_submenus('edit.php?post_type=jetpack-portfolio', array( 'post-new.php?post_type=jetpack-portfolio' => 'https://wordpress.com/edit/jetpack-portfolio/' . $domain));
	$admin_menu->update_submenus('edit.php?post_type=jetpack-testimonial', array( 'post-new.php?post_type=jetpack-testimonial' => 'https://wordpress.com/edit/jetpack-testimonial/' . $domain));

}

add_action( 'admin_menu', 'wpcom_duplicate_views_experiment_update_admin_menu_post_new', PHP_INT_MAX, 0 );
