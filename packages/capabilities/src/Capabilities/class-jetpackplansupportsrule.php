<?php
/**
 * A rule which checks whether this site has a Jetpack plan with the given slug
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class JetpackPlanSupportsRule implements Rule {
	/**
	 * The feature that the current Jetpack plan must support
	 *
	 * @var string supports_slug
	 */
	private $supports_slug;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function __construct( $supports_slug ) {
		$this->supports_slug = $supports_slug;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function check( ...$args ) {
		if ( \Jetpack_Plan::supports( $this->supports_slug ) ) {
			return new PermissionGranted();
		} else {
			return new PermissionDenied(
				// translators: Argument is a Jetpack plan slug, e.g. jetpack_premium.
				sprintf( __( 'You must have plan %s to perform this action', 'jetpack' ), $this->supports_slug )
			);
		}
	}
}
