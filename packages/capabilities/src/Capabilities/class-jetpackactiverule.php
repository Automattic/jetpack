<?php
/**
 * A rule which evaluates a filter and compares the output with a required value
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class JetpackActiveRule implements Rule {
	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function check( ...$args ) {
		return \Jetpack::is_active() ?
			new PermissionGranted() :
			new PermissionDenied(
				sprintf( __( 'Jetpack must be connected', 'jetpack' ) )
			);
	}
}
