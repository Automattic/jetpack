<?php
/**
 * Code Editors
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\CodeEditor;

const VERSION       = '2.2';
const MODULE_PREFIX = '@a8cCodeEditor/';

const JS_EXTENSION = SCRIPT_DEBUG ? '.js' : '.min.js';

/** Set up the plugin. */
function init() {
	$asset_manifest = include plugin_dir_path( __FILE__ ) . '../../build-module/assets.php';

	$modules = array(
		'code-editor/code-editor.js'                 => MODULE_PREFIX . 'code-editor',
		'codemirror/codemirror.js'                   => MODULE_PREFIX . 'codemirror-bundle',
		'site-additional-css/site-additional-css.js' => MODULE_PREFIX . 'site-additional-css',
	);
	/**
	 * Module data keyed by module ID.
	 *
	 * @var array<string, array{dependencies: array, version: string, type: string, src: string}> $asset_manifest
	 */
	$module_assets = array();
	foreach ( $modules as $path => $module_id ) {
		if ( ! isset( $asset_manifest[ $path ] ) ) {
			return;
		}

		$module_assets[ $module_id ]              = $asset_manifest[ $path ];
		$module_assets[ $module_id ]['module_id'] = $module_id;
		$module_assets[ $module_id ]['src']       = plugins_url( '../../build-module/' . $path, __FILE__ );
	}

	foreach ( $module_assets as $module_id => $asset_manifest ) {
		wp_register_script_module(
			$module_id,
			$asset_manifest['src'],
			$asset_manifest['dependencies'],
			$asset_manifest['version']
		);
	}
}

/**
 * Enqueue plugin assets necessary for the block editor.
 */
function enqueue_editor_assets() {
	$user_prefers_syntax_highlight = 'false' !== wp_get_current_user()->syntax_highlighting;

	/**
	 * Filter to enable or disable the improved code editor.
	 *
	 * This feature enhances the "code editor" views in the Post and Site Editors.
	 */
	$should_load_code_editor = apply_filters( 'a8c_code_editor_should_load_code_editor', $user_prefers_syntax_highlight );
	if ( $should_load_code_editor ) {
		wp_enqueue_script_module( MODULE_PREFIX . 'code-editor' );

		// Enqeue code editor script dependencies.
		wp_enqueue_script( 'react' );
		wp_enqueue_script( 'wp-blocks' );
		wp_enqueue_script( 'wp-components' );
		wp_enqueue_script( 'wp-compose' );
		wp_enqueue_script( 'wp-core-data' );
		wp_enqueue_script( 'wp-data' );
		wp_enqueue_script( 'wp-editor' );
		wp_enqueue_script( 'wp-i18n' );
		wp_enqueue_script( 'wp-keyboard-shortcuts' );
		wp_enqueue_script( 'wp-plugins' );
		wp_enqueue_script( 'wp-private-apis' );
	}

	/**
	 * Filter to enable or disable the improved code editor.
	 *
	 * This feature enhances the "Additional CSS" panel in the Site Editor.
	 */
	$should_load_css_editor = apply_filters( 'a8c_code_editor_should_load_css_editor', $user_prefers_syntax_highlight );
	if ( $should_load_css_editor ) {
		wp_enqueue_script_module( MODULE_PREFIX . 'site-additional-css' );
		// The additional CSS panel has no script dependencies.
	}
}

// Core should handle this, but Script Module assets are not currently handled.
add_action(
	'wp_enqueue_scripts',
	function () {
		if ( wp_should_load_block_editor_scripts_and_styles() ) {
			enqueue_editor_assets();
		}
	}
);
add_action( 'init', __NAMESPACE__ . '\\init' );
add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\\enqueue_editor_assets' );
