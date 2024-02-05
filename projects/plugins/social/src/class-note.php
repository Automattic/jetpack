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
				'name'                  => esc_html__( 'Social Notes', 'jetpack-social' ),
				'singular_name'         => esc_html__( 'Social Note', 'jetpack-social' ),
				'menu_name'             => esc_html__( 'Social Notes', 'jetpack-social' ),
				'name_admin_bar'        => esc_html__( 'Social Note', 'jetpack-social' ),
				'add_new'               => esc_html__( 'Add New', 'jetpack-social' ),
				'add_new_item'          => esc_html__( 'Add New Note', 'jetpack-social' ),
				'new_item'              => esc_html__( 'New Note', 'jetpack-social' ),
				'edit_item'             => esc_html__( 'Edit Note', 'jetpack-social' ),
				'view_item'             => esc_html__( 'View Note', 'jetpack-social' ),
				'all_items'             => esc_html__( 'All Notes', 'jetpack-social' ),
				'search_items'          => esc_html__( 'Search Notes', 'jetpack-social' ),
				'parent_item_colon'     => esc_html__( 'Parent Notes:', 'jetpack-social' ),
				'not_found'             => esc_html__( 'No Notes found.', 'jetpack-social' ),
				'not_found_in_trash'    => esc_html__( 'No Notes found in Trash.', 'jetpack-social' ),
				'archives'              => esc_html__( 'Notes archives', 'jetpack-social' ),
				'insert_into_item'      => esc_html__( 'Insert into Note', 'jetpack-social' ),
				'uploaded_to_this_item' => esc_html__( 'Uploaded to this Note', 'jetpack-social' ),
				'filter_items_list'     => esc_html__( 'Filter Notes list', 'jetpack-social' ),
				'items_list_navigation' => esc_html__( 'Notes list navigation', 'jetpack-social' ),
				'items_list'            => esc_html__( 'Notes list', 'jetpack-social' ),
			),
			'show_in_rest' => true,
			'supports'     => array( 'editor', 'thumbnail', 'publicize' ),
			'menu_icon'    => 'dashicons-welcome-write-blog',

		);
		register_post_type( 'jetpack_social_note', $args );
	}
}
