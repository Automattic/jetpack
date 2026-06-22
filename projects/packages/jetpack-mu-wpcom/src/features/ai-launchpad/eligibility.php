<?php
/**
 * AI Launchpad eligibility — single source of truth shared by the admin-menu
 * gate (AI_Launchpad::register_menu) and the REST controller
 * (AI_Launchpad_REST::check_eligibility), which both resolve to this.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'wpcom_ai_launchpad_is_eligible' ) ) {
	/**
	 * Whether the current site may use the AI Launchpad.
	 *
	 * @return bool
	 */
	function wpcom_ai_launchpad_is_eligible() {
		return \Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad::is_eligible();
	}
}
