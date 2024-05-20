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
	const JETPACK_SOCIAL_NOTES_CONFIG = 'jetpack_social_notes_config';
	const FLUSH_REWRITE_RULES_FLUSHED = 'jetpack_social_rewrite_rules_flushed';

	/**
	 * Check if the feature is enabled.
	 */
	public function enabled() {
		return (bool) get_option( self::JETPACK_SOCIAL_NOTE_CPT );
	}

	/**
	 * Initialize the Jetpack Social Note custom post type.
	 */
	public function init() {
		if ( ! self::enabled() ) {
			return;
		}
		add_filter( 'allowed_block_types', array( $this, 'restrict_blocks_for_social_note' ), 10, 2 );

		self::register_cpt();
		add_action( 'wp_insert_post_data', array( $this, 'set_empty_title' ), 10, 2 );
		add_action( 'admin_init', array( $this, 'admin_init_actions' ) );
	}

	/**
	 * Things to do on admin_init.
	 */
	public function admin_init_actions() {
		\Automattic\Jetpack\Post_List\Post_List::setup();
		add_action( 'current_screen', array( $this, 'add_filters_and_actions_for_screen' ), 5 );
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
		add_filter( 'jetpack_post_list_display_share_action', array( $this, 'show_share_action' ), 10, 2 );
	}

	/**
	 * Used as a filter to determine if we should show the share action on the post list screen.
	 *
	 * @param bool   $show_share The current filter value.
	 * @param string $post_type The current post type on the post list screen.
	 * @return bool Whether to show the share action.
	 */
	public function show_share_action( $show_share, $post_type ) {
		return self::JETPACK_SOCIAL_NOTE_CPT === $post_type || $show_share;
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
			'has_archive'  => true,
			'supports'     => array( 'editor', 'comments', 'thumbnail', 'publicize', 'enhanced_post_list', 'activitypub' ),
			'menu_icon'    => 'dashicons-welcome-write-blog',
			'rewrite'      => array( 'slug' => 'sn' ),
			'template'     => array(
				array(
					'core/paragraph',
					array(
						'placeholder' => __( "What's on your mind?", 'jetpack-social' ),
					),
				),
				// We should add this back when the double featured image issue is fixed.
				// array(
				// 'core/post-featured-image',
				// ),
			),
		);
		register_post_type( self::JETPACK_SOCIAL_NOTE_CPT, $args );
		self::maybe_flush_rewrite_rules();
	}

	/**
	 * Restrict the blocks for the Social Note CPT.
	 *
	 * @param array    $allowed_blocks The allowed blocks.
	 * @param \WP_Post $post The post.
	 * @return array The allowed blocks.
	 */
	public function restrict_blocks_for_social_note( $allowed_blocks, $post ) {
		if ( 'jetpack-social-note' === $post->post_type ) {
			// Only allow the paragraph block and the featured image block.
			$allowed_blocks = array(
				'core/paragraph',
				'core/post-featured-image',
			);
		}

		return $allowed_blocks;
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
	 * Set whether or not the Notes feature is enabled.
	 *
	 * @param boolean $enabled Whether or not the Notes feature is enabled.
	 */
	public function set_enabled( $enabled ) {
		if ( $enabled === self::enabled() ) {
			return;
		}

		if ( $enabled ) {
			update_option( self::JETPACK_SOCIAL_NOTE_CPT, true );
		} else {
			delete_option( self::JETPACK_SOCIAL_NOTE_CPT );
		}
		// Delete this option, so the rules get flushe in maybe_flush_rewrite_rules when the CPT is registered.
		delete_option( self::FLUSH_REWRITE_RULES_FLUSHED );
	}

	/**
	 * Get the social notes config.
	 *
	 * @return array The social notes config.
	 */
	public function get_config() {
		return get_option(
			self::JETPACK_SOCIAL_NOTES_CONFIG,
			// Append link by default.
			array(
				'append_link' => true,
			)
		);
	}

	/**
	 * Update social notes config
	 *
	 * @param array $config The config to update.
	 */
	public function update_config( $config ) {
		$old_config = get_option( self::JETPACK_SOCIAL_NOTES_CONFIG, array() );
		$new_config = array_merge( $old_config, $config );
		update_option( self::JETPACK_SOCIAL_NOTES_CONFIG, $new_config );
	}

	/**
	 * Use the_title hook so we show the social note's exceprt in the post list view.
	 *
	 * @param array $title The title of the post, which we have set to be an empty string for Social Notes.
	 * @param array $post_id The Post ID.
	 */
	public function override_empty_title( $title, $post_id ) {
		if ( get_post_type( $post_id ) === self::JETPACK_SOCIAL_NOTE_CPT ) {
			return wp_trim_words( get_the_excerpt(), 10 );
		}

		// Return the original title for other cases.
		return $title;
	}
}
