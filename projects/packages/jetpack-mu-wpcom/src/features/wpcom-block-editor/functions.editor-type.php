<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * This file contains some 'remember' functions inspired by the core Classic Editor Plugin
 * Used to align the 'last editor' metadata so that it is set on all Jetpack and WPCOM sites
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Block_Editor\EditorType;

use WP_Block_Editor_Context;

/**
 * Remember when the classic editor was used to edit a post.
 *
 * @param object $post The post being editted.
 */
function remember_classic_editor( $post ) {
	$post_type = get_post_type( $post );

	if ( $post_type && post_type_supports( $post_type, 'editor' ) ) {
		remember_editor( $post->ID, 'classic-editor' );
	}
}

/**
 * Remember when the block editor was used to edit a post.
 *
 * @param  array                   $editor_settings This is hooked into a filter and this is the settings that are passed in.
 * @param  WP_Block_Editor_Context $post            The block editor context.
 *
 * @return array The unmodified $editor_settings parameter.
 */
function remember_block_editor( $editor_settings, $post ) {
	if ( ! empty( $post->post ) ) {
		$post = $post->post;
	}

	if ( empty( $post ) ) {
		return $editor_settings;
	}

	$post_type = get_post_type( $post );
	if ( $post_type && can_edit_post_type( $post_type ) ) {
		remember_editor( $post->ID, 'block-editor' );
	}

	return $editor_settings;
}

/**
 * When the Write editor saves a post via the REST API, record it as the
 * last editor used. The JS client sends wpcom_write_editor_used: true as
 * an extra body param — no REST field registration needed since this is
 * an internal signal, not a public post attribute.
 *
 * @param \WP_Post         $post    The post that was inserted or updated.
 * @param \WP_REST_Request $request The REST request that triggered the save.
 */
function remember_write_editor( $post, $request ) {
	if ( true !== $request['wpcom_write_editor_used'] ) {
		return;
	}
	if ( ! \current_user_can( 'edit_post', $post->ID ) ) {
		return;
	}
	remember_editor( $post->ID, 'write-editor' );
}

\add_action( 'rest_after_insert_post', __NAMESPACE__ . '\remember_write_editor', 10, 2 );

/**
 * Sets the metadata for the specified post and editor.
 *
 * @param int    $post_id The ID of the post to set the metadata for.
 * @param string $editor  String name of the editor: 'classic-editor', 'block-editor', or 'write-editor'.
 */
function remember_editor( $post_id, $editor ) {
	if ( get_post_meta( $post_id, '_last_editor_used_jetpack', true ) !== $editor ) {
		update_post_meta( $post_id, '_last_editor_used_jetpack', $editor );
	}
}

/**
 * Checks whether the block editor can be used with the given post type.
 *
 * @param  string $post_type The post type to check.
 * @return bool              Whether the block editor can be used to edit the supplied post type.
 */
function can_edit_post_type( $post_type ) {
	return use_block_editor_for_post_type( $post_type );
}
