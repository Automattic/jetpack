<?php
/**
 * A rule which evaluates whether the user has a required role
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class WPRoleRule implements Rule {
	/**
	 * The required role
	 *
	 * @var string wp_role
	 */
	private $wp_role;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function __construct( $wp_role ) {
		$this->wp_role = $wp_role;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function check( ...$args ) {
		$user = wp_get_current_user();

		if ( in_array( $this->wp_role, $user->roles, true ) ) {
			return new PermissionGranted();
		}

		return new PermissionDenied(
			// translators: Argument is a WordPress user role.
			sprintf( __( 'You must be a %s to perform this action', 'jetpack' ), $this->wp_role )
		);
	}
}
