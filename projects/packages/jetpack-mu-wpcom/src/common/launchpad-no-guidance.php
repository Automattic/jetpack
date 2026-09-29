<?php
/**
 * No-guidance launchpad state.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! function_exists( 'wpcom_launchpad_is_no_guidance' ) ) {
	/**
	 * Whether the site gets no setup guidance: no My Home, Site Setup, or launchpad widget, either because
	 * `wpcom_launchpad_no_guidance` is set or because the AI Launchpad was enabled and then skipped.
	 *
	 * @return bool
	 */
	function wpcom_launchpad_is_no_guidance() {
		if ( get_option( 'wpcom_launchpad_no_guidance' ) ) {
			return true;
		}

		return (bool) get_option( 'wpcom_ai_launchpad_enabled' ) && (bool) get_option( 'wpcom_ai_launchpad_dismissed' );
	}
}
