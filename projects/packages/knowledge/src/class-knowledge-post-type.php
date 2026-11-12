<?php
/**
 * Knowledge Post Type registration.
 *
 * @package automattic/jetpack-knowledge
 */

namespace Automattic\Jetpack\Knowledge;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Handles registration of the Knowledge custom post type.
 */
class Knowledge_Post_Type {

	/**
	 * The post type name.
	 *
	 * @var string
	 */
	const POST_TYPE = 'wp_knowledge';

	/**
	 * The taxonomy name for knowledge types.
	 *
	 * @var string
	 */
	const TAXONOMY = 'wp_knowledge_type';

	/**
	 * Taxonomy term slug for the `guideline` knowledge type.
	 *
	 * @var string
	 */
	const TERM_GUIDELINE = 'guideline';

	/**
	 * Register the custom post type.
	 */
	public static function register(): void {
		if ( post_type_exists( self::POST_TYPE ) ) {
			return;
		}

		register_post_type(
			self::POST_TYPE,
			array(
				'labels'                => array(
					'name'                     => _x( 'Guidelines', 'post type general name', 'jetpack-knowledge' ),
					'singular_name'            => _x( 'Guideline', 'post type singular name', 'jetpack-knowledge' ),
					'add_new'                  => __( 'Add Guideline', 'jetpack-knowledge' ),
					'add_new_item'             => __( 'Add Guideline', 'jetpack-knowledge' ),
					'all_items'                => __( 'All Guidelines', 'jetpack-knowledge' ),
					'edit_item'                => __( 'Edit Guideline', 'jetpack-knowledge' ),
					'filter_items_list'        => __( 'Filter guidelines list', 'jetpack-knowledge' ),
					'item_published'           => __( 'Guideline published.', 'jetpack-knowledge' ),
					'item_published_privately' => __( 'Guideline published privately.', 'jetpack-knowledge' ),
					'item_reverted_to_draft'   => __( 'Guideline reverted to draft.', 'jetpack-knowledge' ),
					'item_scheduled'           => __( 'Guideline scheduled.', 'jetpack-knowledge' ),
					'item_updated'             => __( 'Guideline updated.', 'jetpack-knowledge' ),
					'items_list'               => __( 'Guidelines list', 'jetpack-knowledge' ),
					'items_list_navigation'    => __( 'Guidelines list navigation', 'jetpack-knowledge' ),
					'new_item'                 => __( 'New Guideline', 'jetpack-knowledge' ),
					'not_found'                => __( 'No guidelines found.', 'jetpack-knowledge' ),
					'not_found_in_trash'       => __( 'No guidelines found in Trash.', 'jetpack-knowledge' ),
					'search_items'             => __( 'Search Guidelines', 'jetpack-knowledge' ),
					'view_item'                => __( 'View Guideline', 'jetpack-knowledge' ),
					'view_items'               => __( 'View Guidelines', 'jetpack-knowledge' ),
				),
				'public'                => false,
				// Knowledge rows are managed through the REST API without post-type screens.
				'show_ui'               => false,
				'show_in_rest'          => true,
				'rest_base'             => 'knowledge',

				'rest_controller_class' => Knowledge_REST_Controller::class,

				// Primitive capabilities stay plural and meta capabilities singular to avoid collisions.
				'capability_type'       => array( 'knowledge_item', 'knowledge_items' ),
				'map_meta_cap'          => true,
				// `read` is remapped so Subscribers (who hold the base `read`
				// cap) are blocked at the post-type door. Every other primitive
				// defaults to a knowledge_items-suffixed cap synthesized by
				// `wp_maybe_grant_knowledge_caps()`.
				'capabilities'          => array(
					'read' => 'read_knowledge_items',
				),
				'supports'              => array( 'title', 'editor', 'excerpt', 'author', 'revisions' ),
				'hierarchical'          => false,
				'has_archive'           => false,
				'rewrite'               => false,
				'query_var'             => false,
				'can_export'            => true,
			)
		);

		/*
		 * Disable autosave endpoints for knowledge. 'editor' support implies 'autosave', but knowledge is
		 * headless storage with no editor session, so the autosave REST routes have no consumer.
		 */
		remove_post_type_support( self::POST_TYPE, 'autosave' );

		register_taxonomy(
			self::TAXONOMY,
			self::POST_TYPE,
			array(
				'public'             => false,
				'publicly_queryable' => false,
				'hierarchical'       => true,
				'labels'             => array(
					'name'                  => _x( 'Guideline Types', 'taxonomy general name', 'jetpack-knowledge' ),
					'singular_name'         => _x( 'Guideline Type', 'taxonomy singular name', 'jetpack-knowledge' ),
					'add_new_item'          => __( 'Add Guideline Type', 'jetpack-knowledge' ),
					'add_or_remove_items'   => __( 'Add or remove guideline types', 'jetpack-knowledge' ),
					'back_to_items'         => __( '&larr; Go to Guideline Types', 'jetpack-knowledge' ),
					'edit_item'             => __( 'Edit Guideline Type', 'jetpack-knowledge' ),
					'item_link'             => __( 'Guideline Type Link', 'jetpack-knowledge' ),
					'item_link_description' => __( 'A link to a guideline type.', 'jetpack-knowledge' ),
					'items_list'            => __( 'Guideline Types list', 'jetpack-knowledge' ),
					'items_list_navigation' => __( 'Guideline Types list navigation', 'jetpack-knowledge' ),
					'new_item_name'         => __( 'New Guideline Type Name', 'jetpack-knowledge' ),
					'no_terms'              => __( 'No guideline types', 'jetpack-knowledge' ),
					'not_found'             => __( 'No guideline types found.', 'jetpack-knowledge' ),
					'search_items'          => __( 'Search Guideline Types', 'jetpack-knowledge' ),
					'update_item'           => __( 'Update Guideline Type', 'jetpack-knowledge' ),
					'view_item'             => __( 'View Guideline Type', 'jetpack-knowledge' ),
				),

				/*
				 * Editing and assigning terms reuse the `wp_knowledge` primitive `edit_knowledge_items` so that anyone
				 * who can edit a knowledge row can also lazily create and assign its type.
				 */
				'capabilities'       => array(
					'manage_terms' => 'manage_options',
					'edit_terms'   => 'edit_knowledge_items',
					'delete_terms' => 'manage_options',
					'assign_terms' => 'edit_knowledge_items',
				),
				'query_var'          => false,
				'rewrite'            => false,
				// Headless, like the post type: knowledge type terms are managed
				// through the REST API, not a wp-admin taxonomy screen.
				'show_ui'            => false,
				'show_in_nav_menus'  => false,
				'show_in_rest'       => true,
			)
		);

		add_filter( 'user_has_cap', 'wp_maybe_grant_knowledge_caps', 1, 4 );
		add_action( 'save_post_' . self::POST_TYPE, 'wp_knowledge_ensure_default_type_term' );
		add_filter( 'wp_insert_term_data', 'wp_knowledge_maybe_map_term_label', 10, 2 );

		// Sanitize guideline content and re-stamp registry scope titles on the
		// REST insert path. Slug uniqueness is left to WordPress: the published
		// row keeps its exact slug and duplicates are suffixed (see knowledge.php).
		add_filter( 'rest_pre_insert_' . self::POST_TYPE, 'wp_knowledge_guard_guideline_row', 10, 2 );
	}
}
