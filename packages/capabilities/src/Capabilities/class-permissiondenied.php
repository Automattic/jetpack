<?php
/**
 * A convenience class representing a permission which has been denied, along with an error message
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class PermissionDenied implements Permission {
	/**
	 * A user-facing error message
	 *
	 * @var string error_message
	 */
	private $error_message;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function __construct( $error_message ) {
		$this->error_message = $error_message;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function granted() {
		return false;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function message() {
		return $this->error_message;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function data() {
		return null;
	}
}
