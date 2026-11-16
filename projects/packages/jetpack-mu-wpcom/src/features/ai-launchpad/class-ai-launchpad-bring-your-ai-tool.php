<?php
/**
 * AI Launchpad: the "Bring your AI tool" experiment.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Status\Host;

/**
 * Assigns free sites to the experiment that opens the wizard on a "Guide me" or "Build with AI" choice.
 */
class AI_Launchpad_Bring_Your_AI_Tool {

	/**
	 * The ExPlat experiment.
	 */
	const EXPERIMENT = 'wpcom_ai_launchpad_bring_your_ai_tool_202611';

	/**
	 * The variation that opens the wizard on the setup choice. The other variation, `control`, opens on the goals.
	 */
	const TREATMENT = 'bring_your_ai_tool';

	/**
	 * The user's variation, or null for a user the experiment is not for.
	 *
	 * Only an administrator of a Free Simple site is assigned. Every other check runs first, so an
	 * ineligible user never enters the experiment.
	 *
	 * @return string|null
	 */
	public static function get_variation() {
		if ( ! current_user_can( 'manage_options' ) || ! self::is_free_site() ) {
			return null;
		}

		/**
		 * Overrides the "Bring your AI tool" experiment assignment on the Site Setup page, for testing.
		 *
		 * The eligibility checks still apply; only the assignment is replaced.
		 *
		 * @param bool|null $override True to force the treatment, false to force control, or null to ask ExPlat.
		 */
		$override = apply_filters( 'wpcom_ai_launchpad_bring_your_ai_tool_override_is_treatment', null );
		if ( null !== $override ) {
			return $override ? self::TREATMENT : 'control';
		}

		if ( ! function_exists( '\ExPlat\assign_current_user' ) ) {
			return null;
		}

		return \ExPlat\assign_current_user( self::EXPERIMENT );
	}

	/**
	 * Whether the site is on the Free plan: a Simple site with no paid plan bundle. Atomic sites always have one.
	 *
	 * Fails closed when the purchases helper is missing: an empty list would otherwise read as Free.
	 *
	 * @return bool
	 */
	private static function is_free_site() {
		if ( ! ( new Host() )->is_wpcom_simple() || ! function_exists( 'wpcom_expiry_get_purchases' ) ) {
			return false;
		}

		// Real plan bundles only, as in AI_Launchpad_Difm_Offer::has_eligible_plan().
		$bundles = wp_list_filter( (array) wpcom_expiry_get_purchases(), array( 'product_type' => 'bundle' ) );
		$plan    = Expiry_Data::pick_primary_plan_purchase( $bundles );
		$slug    = $plan && isset( $plan->product_slug ) && is_string( $plan->product_slug ) ? $plan->product_slug : 'free_plan';

		return 'free_plan' === $slug;
	}
}
