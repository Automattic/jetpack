<?php
/**
 * A convenience class representing a permission which has been granted
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class PermissionGranted implements Permission {

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function granted() {
		return true;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function message() {
		return null;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function data() {
		return null;
	}
}
