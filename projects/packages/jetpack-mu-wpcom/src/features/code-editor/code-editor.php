<?php
/**
 * Plugin Name:       A8C Code Editor
 * Description:       Modernize the WordPress code-editing experience.
 * Version:           2.2
 * Requires at least: 6.7
 * Tested up to:      6.8
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Author:            Automattic, Inc.
 * Author URI:        https://automattic.com
 * Text Domain:       a8c-code-editor
 *
 * @package A8C\CodeEditor
 */

declare( strict_types = 1 );

// phpcs:ignore
namespace A8C\CodeEditor;

const VERSION       = '2.2';
const MODULE_PREFIX = '@a8cCodeEditor/';

const JS_EXTENSION = SCRIPT_DEBUG ? '.js' : '.min.js';

/** Set up the plugin. */
function init() {
	wp_register_script_module(
		MODULE_PREFIX . 'codemirror-bundle',
		plugins_url( 'build-modules/codemirror/codemirror' . JS_EXTENSION, __FILE__ ),
		array(),
		get_version( 'build-modules/codemirror/codemirror' . JS_EXTENSION )
	);

	wp_register_script_module(
		MODULE_PREFIX . 'code-editor',
		plugins_url( 'build-modules/code-editor/code-editor' . JS_EXTENSION, __FILE__ ),
		array(
			array(
				'import' => 'dynamic',
				'id' => MODULE_PREFIX . 'codemirror-bundle',
			),
		),
		get_version( 'build-modules/code-editor/code-editor' . JS_EXTENSION )
	);

	wp_register_script_module(
		MODULE_PREFIX . 'site-additional-css',
		plugins_url( 'build-modules/site-additional-css/site-additional-css' . JS_EXTENSION, __FILE__ ),
		array(
			array(
				'import' => 'dynamic',
				'id' => MODULE_PREFIX . 'codemirror-bundle',
			),
		),
		get_version( 'build-modules/site-additional-css/site-additional-css' . JS_EXTENSION )
	);
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

/**
 * Hook to allow the dummy script module to inject its dependencies into the importmap.
 *
 * Create an opportunity between printing the importmap and printing modules
 * in order to prevent printing the dummy module.
 *
 * This is not essential, but does save some HTML on the page and a network request.
 * The dummy module is only used to signal that some additional modules
 * should be included in the importmap.
 *
 * @TODO: Be safer. Check the return (bool: was removed) and behave accordingly.
 */
function after_setup_theme() {
	foreach ( array( 'wp_head', 'wp_footer', 'admin_print_footer_scripts' ) as $hook ) {
		remove_action( $hook, array( wp_script_modules(), 'print_enqueued_script_modules' ) );
		remove_action( $hook, array( wp_script_modules(), 'print_script_module_preloads' ) );

		add_action(
			$hook,
			function () {
				wp_script_modules()->dequeue( MODULE_PREFIX . 'dummy' );
			},
			15
		);
		add_action( $hook, array( wp_script_modules(), 'print_enqueued_script_modules' ), 20 );
		add_action( $hook, array( wp_script_modules(), 'print_script_module_preloads' ), 20 );
		add_action(
			$hook,
			function () {
				wp_script_modules()->enqueue( MODULE_PREFIX . 'dummy' );
			},
			25
		);

	}
}

function get_version( string $path ): string {
	if ( ! WP_DEBUG ) {
		return VERSION;
	}
	return (string) filemtime( plugin_dir_path( __FILE__ ) . $path );
}

add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\\enqueue_editor_assets' );

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
add_action( 'after_setup_theme', __NAMESPACE__ . '\\after_setup_theme', 100 );
