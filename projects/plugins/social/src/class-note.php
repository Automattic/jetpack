<?php
/**
 * Register the Social note custom post type.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

/**
 * Register the Jetpack Social Note custom post type.
 */
class Note {
	/**
	 * Register the Jetpack Social Note custom post type.
	 */
	public static function register() {
		if ( ! defined( 'JETPACK_SOCIAL_NOTES_ENABLED' ) || ! constant( 'JETPACK_SOCIAL_NOTES_ENABLED' ) ) {
			return;
		}

		$args = array(
			'public'       => true,
			'labels'       => array(
				'name'                  => _x( 'Social Notes', 'Post type general name', 'jetpack-social' ),
				'singular_name'         => _x( 'Social Note', 'Post type singular name', 'jetpack-social' ),
				'menu_name'             => _x( 'Social Notes', 'Admin Menu text', 'jetpack-social' ),
				'name_admin_bar'        => _x( 'Social Note', 'Add New on Toolbar', 'jetpack-social' ),
				'add_new'               => __( 'Add New', 'jetpack-social' ),
				'add_new_item'          => __( 'Add New Social Note', 'jetpack-social' ),
				'new_item'              => __( 'New Social Note', 'jetpack-social' ),
				'edit_item'             => __( 'Edit Social Note', 'jetpack-social' ),
				'view_item'             => __( 'View Social Note', 'jetpack-social' ),
				'all_items'             => __( 'All Social Notes', 'jetpack-social' ),
				'search_items'          => __( 'Search Social Notes', 'jetpack-social' ),
				'parent_item_colon'     => __( 'Parent Social Notes:', 'jetpack-social' ),
				'not_found'             => __( 'No Social Notes found.', 'jetpack-social' ),
				'not_found_in_trash'    => __( 'No Social Notes found in Trash.', 'jetpack-social' ),
				'archives'              => _x( 'Social Notes archives', 'The post type archive label used in nav menus. Default “Post Archives”. Added in 4.4', 'jetpack-social' ),
				'insert_into_item'      => _x( 'Insert into Social Note', 'Overrides the “Insert into post”/”Insert into page” phrase (used when inserting media into a post). Added in 4.4', 'jetpack-social' ),
				'uploaded_to_this_item' => _x( 'Uploaded to this Social Note', 'Overrides the “Uploaded to this post”/”Uploaded to this page” phrase (used when viewing media attached to a post). Added in 4.4', 'jetpack-social' ),
				'filter_items_list'     => _x( 'Filter Social Nots list', 'Screen reader text for the filter links heading on the post type listing screen. Default “Filter posts list”/”Filter pages list”. Added in 4.4', 'jetpack-social' ),
				'items_list_navigation' => _x( 'Social Notes list navigation', 'Screen reader text for the pagination heading on the post type listing screen. Default “Posts list navigation”/”Pages list navigation”. Added in 4.4', 'jetpack-social' ),
				'items_list'            => _x( 'Social Notes list', 'Screen reader text for the items list heading on the post type listing screen. Default “Posts list”/”Pages list”. Added in 4.4', 'jetpack-social' ),
			),
			'show_in_rest' => true,
			'supports'     => array( 'editor', 'thumbnail', 'publicize' ),
			'menu_icon'    => 'dashicons-welcome-write-blog',

		);
		register_post_type( 'jetpack_social_note', $args );
	}
}
