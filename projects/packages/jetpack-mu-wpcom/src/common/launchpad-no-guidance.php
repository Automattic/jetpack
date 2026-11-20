<?php
/**
 * No-guidance launchpad state.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;

if ( ! function_exists( 'wpcom_launchpad_is_past_no_guidance_cutoff' ) ) {
	/**
	 * Whether a WordPress.com blog ID belongs to a site created after new sites stopped getting setup guidance.
	 *
	 * The cutoff is the WPCOM_LAUNCHPAD_NO_GUIDANCE_CUTOFF_BLOG_ID constant; without it, no site is past it.
	 *
	 * @param int $blog_id WordPress.com blog ID.
	 * @return bool
	 */
	function wpcom_launchpad_is_past_no_guidance_cutoff( $blog_id ) {
		$cutoff = (int) Constants::get_constant( 'WPCOM_LAUNCHPAD_NO_GUIDANCE_CUTOFF_BLOG_ID' );

		return $cutoff > 0 && (int) $blog_id >= $cutoff;
	}
}

if ( ! function_exists( 'wpcom_launchpad_is_no_guidance' ) ) {
	/**
	 * Whether the site gets no setup guidance: no My Home, Site Setup, or launchpad widget.
	 *
	 * `wpcom_ai_launchpad_no_guidance` forces it. Otherwise an AI Launchpad site has no guidance once it skips Site
	 * Setup, and any other site has none when it was created past the cutoff.
	 *
	 * @return bool
	 */
	function wpcom_launchpad_is_no_guidance() {
		if ( get_option( 'wpcom_ai_launchpad_no_guidance' ) ) {
			return true;
		}

		if ( get_option( 'wpcom_ai_launchpad_enabled' ) ) {
			return (bool) get_option( 'wpcom_ai_launchpad_dismissed' );
		}

		// get_wpcom_blog_id() is false outside Simple and Atomic, so self-hosted Jetpack sites never reach the cutoff.
		$blog_id = function_exists( 'get_wpcom_blog_id' ) ? get_wpcom_blog_id() : false;

		return $blog_id && wpcom_launchpad_is_past_no_guidance_cutoff( $blog_id );
	}
}
