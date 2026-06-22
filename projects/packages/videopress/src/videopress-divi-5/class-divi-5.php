<?php
/**
 * Divi 5 integration bootstrap for VideoPress.
 *
 * @package automattic/jetpack-videopress
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\VideoPress\Divi5;

use Automattic\Jetpack\VideoPress\Package_Version;
use ET\Builder\Packages\ModuleLibrary\ModuleRegistration;
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

		/*
		 * Divi builds its module library during theme bootstrap, which fires the
		 * dependency-tree action above (once) before this integration loads on
		 * `init` — so the callback misses it on requests like the Divi 5 Migrator's
		 * admin-ajax calls. Register directly here too; VideoPress_Module::load()
		 * is idempotent, so the two paths never double-register.
		 */
		if ( class_exists( ModuleRegistration::class, false ) ) {
			( new VideoPress_Module() )->load();
		}
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
		$asset_file = dirname( __DIR__, 2 ) . '/build/divi-5/index.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : array();

		PackageBuildManager::register_package_build(
			array(
				'name'    => 'jetpack-videopress-divi5-visual-builder',
				// The build content hash, so each build busts the browser cache.
				'version' => $asset['version'] ?? Package_Version::PACKAGE_VERSION,
				'script'  => array(
					'src'                => plugins_url( '../../build/divi-5/index.js', __FILE__ ),

					/*
					 * The handles the build emits (react, react-jsx-runtime and the
					 * Divi-vendored @wordpress/* instances), plus the Divi builder
					 * handles that provide the window.divi.* globals.
					 */
					'deps'               => array_merge(
						array( 'divi-module-library', 'divi-rest' ),
						$asset['dependencies'] ?? array()
					),
					'enqueue_top_window' => false,
					'enqueue_app_window' => true,
				),
			)
		);
	}
}
