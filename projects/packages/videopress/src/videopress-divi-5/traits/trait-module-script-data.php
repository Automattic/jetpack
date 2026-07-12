<?php
/**
 * Front-end script data for the Divi 5 VideoPress module.
 *
 * @package automattic/jetpack-videopress
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\VideoPress\Divi5\Traits;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the module's front-end script data, mirroring the Visual Builder
 * script data component.
 */
trait Module_Script_Data_Trait {

	/**
	 * Registers the module's script data.
	 *
	 * @param array $args The script data callback arguments.
	 *
	 * @return void
	 */
	public static function module_script_data( $args ) {
		$elements = $args['elements'];

		$elements->script_data(
			array(
				'attrName' => 'module',
			)
		);
	}
}
