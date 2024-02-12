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
	const JETPACK_SOCIAL_NOTE_CPT     = 'jetpack-social-note';
	const FLUSH_REWRITE_RULES_FLUSHED = 'jetpack_social_rewrite_rules_flushed';

	/**
	 * Check if the feature is enabled.
	 */
	public function enabled() {
		return get_option( self::JETPACK_SOCIAL_NOTE_CPT );
	}

	/**
	 * Initialize the Jetpack Social Note custom post type.
	 */
	public function init() {
		if ( ! self::enabled() ) {
			return;
		}
		self::register_cpt();
		add_action( 'wp_insert_post_data', array( new Note(), 'set_empty_title' ), 10, 2 );
		add_action( 'current_screen', array( $this, 'add_filters_and_actions_for_screen' ) );
	}

	/**
	 * If the current_screen has 'edit' as the base, add filter to change the post list tables.
	 *
	 * @param object $current_screen The current screen.
	 */
	public function add_filters_and_actions_for_screen( $current_screen ) {
		if ( 'edit' !== $current_screen->base ) {
			return;
		}

		add_filter( 'the_title', array( $this, 'override_empty_title' ), 10, 2 );
	}

	/**
	 * Set the title to empty string.
	 *
	 * @param array $data The Post Data.
	 * @param array $post The Post.
	 */
	public function set_empty_title( $data, $post ) {
		if ( self::JETPACK_SOCIAL_NOTE_CPT === $post['post_type'] && 'auto-draft' === $post['post_status'] ) {
			$data['post_title'] = '';
		}
		return $data;
	}

	/**
	 * Register the Jetpack Social Note custom post type.
	 */
	public function register_cpt() {
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
			'supports'     => array( 'editor', 'thumbnail', 'publicize', 'activitypub' ),
			'menu_icon'    => 'dashicons-welcome-write-blog',
			'rewrite'      => array( 'slug' => 'sn' ),
		);
		register_post_type( self::JETPACK_SOCIAL_NOTE_CPT, $args );
		self::maybe_flush_rewrite_rules();
	}

	/**
	 * Flush rewrite rules so the post permalink works correctly for the Social Note CPT. Flushing is an expensive operation, so do only when necessary.
	 *
	 * @param boolean $force Force flush the rewrite rules.
	 */
	public function maybe_flush_rewrite_rules( $force = false ) {
		if ( empty( get_option( self::FLUSH_REWRITE_RULES_FLUSHED ) ) || $force ) {
			flush_rewrite_rules( false );
			update_option( self::FLUSH_REWRITE_RULES_FLUSHED, true );
		}
	}

	/**
	 * Toggle whether or not the Notes feature is enabled.
	 */
	public function toggle_enabled_status() {
		if ( ! self::enabled() ) {
			update_option( self::JETPACK_SOCIAL_NOTE_CPT, true );
		} else {
			delete_option( self::JETPACK_SOCIAL_NOTE_CPT );
		}
		// Delete this option, so the rules get flushe in maybe_flush_rewrite_rules when the CPT is registered.
		delete_option( self::FLUSH_REWRITE_RULES_FLUSHED );
	}

	/**
	 * Use the_title hook so we show the social note's exceprt in the post list view.
	 *
	 * @param array $title The title of the post, which we have set to be an empty string for Social Notes.
	 * @param array $post_id The Post ID.
	 */
	public function override_empty_title( $title, $post_id ) {
		if ( get_post_type( $post_id ) === self::JETPACK_SOCIAL_NOTE_CPT ) {
			$words = explode( ' ', wp_strip_all_tags( wp_trim_excerpt( get_post_field( 'post_content', $post_id ) ) ) );

			// Get the first 10 words
			$first_10_words = array_slice( $words, 0, 10 );

			// Join the first 10 words back into a string
			return implode( ' ', $first_10_words );

		}

		// Return the original title for other cases
		return $title;
	}
}
