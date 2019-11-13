<?php
/**
 * A rule which evaluates whether a user has the required WP capability
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class WPCapabilityRule implements Rule {
	/**
	 * The required capability
	 *
	 * @var string wp_capability
	 */
	private $wp_capability;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function __construct( $wp_capability ) {
		$this->wp_capability = $wp_capability;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function check( ...$args ) {
		// TODO: this kind of additional argument isn't supported yet - not sure how to pass this through.
		$object_id = isset( $args['object_id'] ) ? $args['object_id'] : null;
		if ( current_user_can( $this->wp_capability, $object_id ) ) {
			return new PermissionGranted();
		}
		return new PermissionDenied(
			// translators: Argument is a WordPress user capability.
			sprintf( __( 'You must have capability %s to perform this action', 'jetpack' ), $this->wp_capability )
		);
	}
}
