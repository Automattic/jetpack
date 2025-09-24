<?php
/**
 * Block Editor - Media Editor plugin feature.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\MediaEditorPlugin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Feature name.
const FEATURE_NAME = 'media-editor-plugin';

/**
 * Register the Media Editor plugin extension.
 *
 * @return void
 */
function register_plugin() {
	\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugin' );

/**
 * Append the Media Editor plugin to the list of available extensions.
 *
 * @param array $extensions Existing extensions.
 *
 * @return array
 */
function add_extension_to_list( $extensions ) {
	return array_merge( (array) $extensions, array( FEATURE_NAME ) );
}
add_filter( 'jetpack_set_available_extensions', __NAMESPACE__ . '\add_extension_to_list' );
