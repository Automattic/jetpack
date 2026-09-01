<?php
/**
 * Class name output for the Divi 5 VideoPress module.
 *
 * @package automattic/jetpack-videopress
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\VideoPress\Divi5\Traits;

use ET\Builder\Packages\Module\Options\Element\ElementClassnames;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Emits the module's class names, mirroring the Visual Builder classnames function.
 */
trait Module_Classnames_Trait {

	/**
	 * Adds the module's decoration class names.
	 *
	 * @param array $args The classnames callback arguments.
	 *
	 * @return void
	 */
	public static function module_classnames( $args ) {
		$classnames_instance = $args['classnamesInstance'];
		$attrs               = $args['attrs'];

		$classnames_instance->add(
			ElementClassnames::classnames(
				array(
					'attrs' => $attrs['module']['decoration'] ?? array(),
				)
			)
		);
	}
}
