<?php
/**
 * Divi 5 VideoPress module.
 *
 * @package automattic/jetpack-videopress
 */

declare( strict_types = 1 );

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
	 * The module's block name. Must match the `name` field in `module.json`.
	 *
	 * @var string
	 */
	const MODULE_NAME = 'jetpack/videopress';

	/**
	 * Registers the module with the Divi 5 module library.
	 *
	 * @return void
	 */
	public function load() {
		/*
		 * Divi walks its dependency tree more than once per request, and
		 * Divi_5::init() also calls this directly, so guard on the registry to
		 * register exactly once. Registering before `init` matches how Divi
		 * registers its own modules during theme bootstrap.
		 */
		if ( \WP_Block_Type_Registry::get_instance()->is_registered( self::MODULE_NAME ) ) {
			return;
		}

		// Read from build/ (shipped) rather than src/client/ (production-excluded).
		ModuleRegistration::register_module(
			dirname( __DIR__, 2 ) . '/build/divi-5/modules/videopress',
			array(
				'render_callback' => array( self::class, 'render_callback' ),
			)
		);
	}
}
