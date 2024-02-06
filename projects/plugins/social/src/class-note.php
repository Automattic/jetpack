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
	const JETPACK_SOCIAL_NOTE_CPT                      = 'jetpack-social-note';
	const JETPACK_SOCIAL_REWRITE_RULES_LAST_FLUSHED_AT = 'jetpack_socia_rewrite_rules_last_flushed_at';

	/**
	 * Check if the feature is enabled.
	 */
	public function enabled() {
		return defined( 'JETPACK_SOCIAL_NOTES_ENABLED' ) && constant( 'JETPACK_SOCIAL_NOTES_ENABLED' );
	}

	/**
	 * Initialize the Jetpack Social Note custom post type.
	 */
	public function init() {
		flush_rewrite_rules();
		if ( ! static::enabled() ) {
			return;
		}
		static::register_cpt();
		add_action( 'wp_insert_post_data', array( new Note(), 'set_empty_title' ), 10, 2 );
	}

	/**
	 * Set the title to empty string.
	 *
	 * @param array $data The Post Data.
	 * @param array $post The Post.
	 */
	public static function set_empty_title( $data, $post ) {
		if ( self::JETPACK_SOCIAL_NOTE_CPT === $post['post_type'] && 'auto-draft' === $post['post_status'] ) {
			$data['post_title'] = '';
		}
		return $data;
	}

	/**
	 * Register the Jetpack Social Note custom post type.
	 */
	public static function register_cpt() {
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
			'supports'     => array( 'editor', 'thumbnail', 'publicize', 'activitypub' ),
			'menu_icon'    => 'dashicons-welcome-write-blog',
		);
		register_post_type( self::JETPACK_SOCIAL_NOTE_CPT, $args );
		static::may_be_flush_rewrite_rules();
	}

	/**
	 * Flush rewrite rules so the post permalink works correctly for the Social Note CPT. Flushing is an expensive operation, so do only when necessary.
	 *
	 * @param boolean $force Force flush the rewrite rules.
	 */
	public static function may_be_flush_rewrite_rules( $force = false ) {
		if ( empty( get_option( self::JETPACK_SOCIAL_REWRITE_RULES_LAST_FLUSHED_AT ) ) || $force ) {
			flush_rewrite_rules();
			update_option( self::JETPACK_SOCIAL_REWRITE_RULES_LAST_FLUSHED_AT, time() );
		}
	}

	/**
	 * Delete the JETPACK_SOCIAL_REWRITE_RULES_LAST_FLUSHED_AT option when plugin is deactivated.
	 */
	public static function delete_rewrite_rules_option() {
		delete_option( self::JETPACK_SOCIAL_REWRITE_RULES_LAST_FLUSHED_AT );
	}
}
