<?php
/**
 * Code Editors
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack;

/**
 * Code Editor class.
 *
 * Add improved code editors functionality. The "code editor" view in the post and site editors and
 * the "Additional CSS" panel found in various places in the site editor are improved with features
 * like syntax highlighting and autocompletion.
 */
abstract class Code_Editor {
	const MODULE_PREFIX = '@a8cCodeEditor/';

	/**
	 * Set up the feature.
	 *
	 * This is the main entry point for the code editor feature.
	 */
	public static function setup() {
		add_action( 'init', array( __CLASS__, 'init' ) );
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_block_editor_assets' ) );
	}

	/**
	 * Init hook.
	 */
	public static function init() {
		// The asset file should always be present, however on CI it is not built.
		// If it were ever absent in a production build, that's unexpected and the
		// feature would be unavailable.
		$asset_path = plugin_dir_path( __FILE__ ) . '../../build-module/assets.php';
		if ( ! file_exists( $asset_path ) ) {
			return;
		}
		$asset_manifest = include $asset_path;

		$modules = array(
			'code-editor/code-editor.js'                 => self::MODULE_PREFIX . 'code-editor',
			'codemirror/codemirror.js'                   => self::MODULE_PREFIX . 'codemirror-bundle',
			'site-additional-css/site-additional-css.js' => self::MODULE_PREFIX . 'site-additional-css',
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
	 * Enqueue block editor assets hook.
	 */
	public static function enqueue_block_editor_assets() {
		$user_prefers_syntax_highlight = 'false' !== wp_get_current_user()->syntax_highlighting;

		/**
		 * Filter to enable or disable the improved code editor.
		 *
		 * This feature enhances the "code editor" views in the Post and Site Editors.
		 */
		$should_load_code_editor = apply_filters( 'jetpack_mu_wpcom_should_load_code_editor', $user_prefers_syntax_highlight );
		if ( $should_load_code_editor ) {
			wp_enqueue_script_module( self::MODULE_PREFIX . 'code-editor' );

			// Enqueue code editor script dependencies.
			wp_enqueue_script( 'wp-i18n' );
		}

		/**
		 * Filter to enable or disable the improved CSS editor.
		 *
		 * This feature enhances the "Additional CSS" panel in the Site Editor.
		 */
		$should_load_css_editor = apply_filters( 'jetpack_mu_wpcom_should_load_css_editor', $user_prefers_syntax_highlight );
		if ( $should_load_css_editor ) {
			wp_enqueue_script_module( self::MODULE_PREFIX . 'site-additional-css' );
			// The additional CSS panel has no script dependencies.
		}
	}
}
