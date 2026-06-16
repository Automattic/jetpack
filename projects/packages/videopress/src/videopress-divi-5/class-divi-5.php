<?php
/**
 * Divi 5 integration bootstrap for VideoPress.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress\Divi5;

use ET\Builder\VisualBuilder\Assets\PackageBuildManager;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Wires the VideoPress module into the Divi 5 framework.
 *
 * Both hooks below are only fired by Divi 5, so this integration stays inert on
 * Divi 4 (where the legacy module continues to handle rendering).
 */
class Divi_5 {

	/**
	 * Registers the Divi 5 hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'divi_module_library_modules_dependency_tree', array( __CLASS__, 'register_module' ) );
		add_action( 'divi_visual_builder_assets_before_enqueue_scripts', array( __CLASS__, 'enqueue_visual_builder_assets' ) );
	}

	/**
	 * Adds the VideoPress module to the Divi 5 module dependency tree.
	 *
	 * @param object $dependency_tree The Divi 5 module dependency tree.
	 *
	 * @return void
	 */
	public static function register_module( $dependency_tree ) {
		$dependency_tree->add_dependency( new VideoPress_Module() );
	}

	/**
	 * Registers the Visual Builder bundle that powers the module's editing UI.
	 *
	 * @return void
	 */
	public static function enqueue_visual_builder_assets() {
		PackageBuildManager::register_package_build(
			array(
				'name'    => 'jetpack-videopress-divi5-visual-builder',
				'version' => '1.0.0',
				'script'  => array(
					'src'                => plugins_url( '../../build/divi-5/index.js', __FILE__ ),
					'deps'               => array(
						'divi-module-library',
						'divi-vendor-wp-hooks',
						'react',
						'jquery-core',
						'divi-rest',
						'wp-hooks',
					),
					'enqueue_top_window' => false,
					'enqueue_app_window' => true,
				),
			)
		);
	}
}
