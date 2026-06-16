<?php
/**
 * Custom CSS fields for the Divi 5 VideoPress module.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress\Divi5\Traits;

use WP_Block_Type_Registry;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Exposes the module's custom CSS fields, as declared in `module.json`.
 */
trait Custom_Css_Trait {

	/**
	 * Returns the registered custom CSS fields for the module.
	 *
	 * @return array The custom CSS field definitions.
	 */
	public static function custom_css() {
		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( 'jetpack/videopress' );

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- Property defined by the Divi 5 framework.
		return $block_type->customCssFields ?? array();
	}
}
