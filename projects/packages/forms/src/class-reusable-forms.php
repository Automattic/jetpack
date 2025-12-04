<?php
/**
 * Reusable Forms class.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms;

/**
 * Handles Reusable Forms functionality.
 */
class Reusable_Forms {

	/**
	 * Initialize the Reusable Forms feature.
	 */
	public static function init() {
		self::register_post_type();
	}

	/**
	 * Register the jetpack-form custom post type.
	 */
	private static function register_post_type() {
		register_post_type(
			'jetpack-form',
			array(
				'labels'                => array(
					'name'                     => __( 'Forms', 'jetpack-forms' ),
					'singular_name'            => __( 'Form', 'jetpack-forms' ),
					'add_new'                  => __( 'Add Form', 'jetpack-forms' ),
					'add_new_item'             => __( 'Add Form', 'jetpack-forms' ),
					'new_item'                 => __( 'New Form', 'jetpack-forms' ),
					'edit_item'                => __( 'Edit Block Form', 'jetpack-forms' ),
					'view_item'                => __( 'View Form', 'jetpack-forms' ),
					'view_items'               => __( 'View Forms', 'jetpack-forms' ),
					'all_items'                => __( 'All Forms', 'jetpack-forms' ),
					'search_items'             => __( 'Search Forms', 'jetpack-forms' ),
					'not_found'                => __( 'No forms found.', 'jetpack-forms' ),
					'not_found_in_trash'       => __( 'No forms found in Trash.', 'jetpack-forms' ),
					'filter_items_list'        => __( 'Filter forms list', 'jetpack-forms' ),
					'items_list_navigation'    => __( 'Forms list navigation', 'jetpack-forms' ),
					'items_list'               => __( 'Forms list', 'jetpack-forms' ),
					'item_published'           => __( 'Form published.', 'jetpack-forms' ),
					'item_published_privately' => __( 'Form published privately.', 'jetpack-forms' ),
					'item_reverted_to_draft'   => __( 'Form reverted to draft.', 'jetpack-forms' ),
					'item_scheduled'           => __( 'Form scheduled.', 'jetpack-forms' ),
					'item_updated'             => __( 'Form updated.', 'jetpack-forms' ),
				),
				'public'                => false,
				'show_ui'               => true, // not sure we need this.
				'show_in_menu'          => false,
				'rewrite'               => false,
				'query_var'             => false,
				'show_in_rest'          => true,
				'rest_base'             => 'jetpack-forms',
				'rest_controller_class' => 'Automattic\Jetpack\Forms\ContactForm\REST_Jetpack_Form_Controller',
				'capability_type'       => 'post',
				'capabilities'          => array(
					// You need to be able to edit posts, in order to read blocks in their raw form.
					'read'                   => 'edit_posts',
					// You need to be able to publish posts, in order to create blocks.
					'create_posts'           => 'publish_posts',
					'edit_posts'             => 'edit_posts',
					'edit_published_posts'   => 'edit_published_posts',
					'delete_published_posts' => 'delete_published_posts',
					// Enables trashing draft posts as well.
					'delete_posts'           => 'delete_posts',
					'edit_others_posts'      => 'edit_others_posts',
					'delete_others_posts'    => 'delete_others_posts',
				),
				'map_meta_cap'          => true,
				'supports'              => array(
					'title',
					'excerpt',
					'editor',
					'revisions',
					'custom-fields',
				),
			)
		);
	}
}
