<?php
/**
 * Divi 5 VideoPress module.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress\Divi5;

use Automattic\Jetpack\VideoPress\Divi5\Traits\Module_Classnames_Trait;
use Automattic\Jetpack\VideoPress\Divi5\Traits\Module_Script_Data_Trait;
use Automattic\Jetpack\VideoPress\Divi5\Traits\Module_Styles_Trait;
use Automattic\Jetpack\VideoPress\Divi5\Traits\Render_Callback_Trait;
use ET\Builder\Framework\DependencyManagement\Interfaces\DependencyInterface;
use ET\Builder\Packages\ModuleLibrary\ModuleRegistration;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers and renders the VideoPress module within the Divi 5 framework.
 *
 * The `ET\Builder\*` symbols this class relies on only exist while Divi 5 is
 * active, which is why the class is loaded lazily from hooks that Divi 5 fires.
 */
class VideoPress_Module implements DependencyInterface {

	use Render_Callback_Trait;
	use Module_Classnames_Trait;
	use Module_Styles_Trait;
	use Module_Script_Data_Trait;

	/**
	 * Matches a VideoPress URL or GUID and captures the GUID. Kept in sync with
	 * the regex used by the Visual Builder renderer.
	 *
	 * @var string
	 */
	const VIDEOPRESS_REGEX = '/^(?:(?:http(?:s)?:\/\/)?(?:www\.)?video(?:\.word)?press\.com\/(?:v|embed)\/)?([a-zA-Z\d]+)(?:.*)?/i';

	/**
	 * Registers the module with the Divi 5 module library.
	 *
	 * @return void
	 */
	public function load() {
		/*
		 * Divi rebuilds its module dependency tree more than once per request
		 * (front-end render and builder asset enqueue both walk it, each with a
		 * fresh instance), so guard against registering the module twice. A
		 * method-static flag is required because the instance differs each time.
		 */
		static $registered = false;
		if ( $registered ) {
			return;
		}
		$registered = true;

		$module_json_folder_path = dirname( __DIR__ ) . '/client/divi-5/modules/videopress';

		$register = function () use ( $module_json_folder_path ) {
			ModuleRegistration::register_module(
				$module_json_folder_path,
				array(
					'render_callback' => array( self::class, 'render_callback' ),
				)
			);
		};

		/*
		 * Divi can build its dependency tree once `init` is already underway or
		 * finished (e.g. during builder asset enqueue), where deferring to `init`
		 * would never run. Register immediately in that case, otherwise defer.
		 */
		if ( did_action( 'init' ) ) {
			$register();
		} else {
			add_action( 'init', $register );
		}
	}
}
