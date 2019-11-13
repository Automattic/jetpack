<?php
/**
 * A rule which checks whether this site has a Jetpack plan with the given slug
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack\Capabilities;

// phpcs:ignore Squiz.Commenting.ClassComment.Missing
class JetpackPlanRule implements Rule {
	/**
	 * The _minimum_ required Jetpack plan slug
	 *
	 * @var string plan_slug
	 */
	private $plan_slug;

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function __construct( $plan_slug ) {
		$this->plan_slug = $plan_slug;
	}

	// phpcs:ignore Squiz.Commenting.FunctionComment.Missing
	public function check( ...$args ) {
		$plan = \Jetpack_Plan::get();
		if ( $this->plan_slug === $plan['product_slug'] ) {
			return new PermissionGranted();
		} else {
			return new PermissionDenied(
				// translators: Argument is a Jetpack plan slug, e.g. jetpack_premium.
				sprintf( __( 'You must have plan %s to perform this action', 'jetpack' ), $this->plan_slug )
			);
		}
	}
}
