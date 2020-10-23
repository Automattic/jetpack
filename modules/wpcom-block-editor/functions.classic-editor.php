<?php
/**
 * This file contains some 'remember' functions taken from the core Classic Editor Plugin
 * Used to align the 'last editor' metadata so that it is set on all Jetpack and WPCOM sites
 *
 * @package Jetpack
 */

namespace Jetpack\ClassicEditor;

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
 * @param  object $editor_settings This is hooked into a filter and this is the settings that are passed in.
 * @param  object $post            The post being editted.
 * @return object                  The unmodified $editor_settings parameter.
 */
function remember_block_editor( $editor_settings, $post ) {
	$post_type = get_post_type( $post );

	if ( $post_type && classic_editor_can_edit_post_type( $post_type ) ) {
		remember_editor( $post->ID, 'block-editor' );
	}

	return $editor_settings;
}

/**
 * Sets the metadata for the specified post and editor.
 *
 * @param int    $post_id The ID of the post to set the metadata for.
 * @param string $editor  String name of the editor, 'classic-editor' or 'block-editor'.
 */
function remember_editor( $post_id, $editor ) {
	if ( get_post_meta( $post_id, '_last_editor_used', true ) !== $editor ) {
		update_post_meta( $post_id, '_last_editor_used', $editor );
	}
}

/**
 * Checks whether the block editor can be used with the given post type.
 *
 * @param  string $post_type The post type to check.
 * @return bool              Whether the block editor can be used to edit the supplied post type.
 */
function classic_editor_can_edit_post_type( $post_type ) {
	$can_edit = false;

	if ( function_exists( 'gutenberg_can_edit_post_type' ) ) {
		$can_edit = gutenberg_can_edit_post_type( $post_type );
	} elseif ( function_exists( 'use_block_editor_for_post_type' ) ) {
		$can_edit = use_block_editor_for_post_type( $post_type );
	}

	return $can_edit;
}
