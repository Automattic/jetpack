<?php
/**
 * A rule which evaluates a filter and compares the output with a required value
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class WPFilterRule implements Rule {
	/**
	 * The id of the filter to apply
	 *
	 * @var string filter_name
	 */
	private $filter_name;

	/**
	 * The value to be compared with the filter output
	 *
	 * @var string required_value
	 */
	private $required_value;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function __construct( $filter_name, $required_value, $initial_value = false ) {
		$this->filter_name    = $filter_name;
		$this->required_value = $required_value;
		$this->initial_value  = $initial_value;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function check( ...$args ) {
		$result = apply_filters( $this->filter_name, $this->initial_value );

		if ( $result === $this->required_value ) {
			return new PermissionGranted();
		}

		return new PermissionDenied(
			// translators: Argument is a WordPress filter name.
			sprintf( __( 'Accessed blocked by filter %s', 'jetpack' ), $this->filter_name )
		);
	}
}
