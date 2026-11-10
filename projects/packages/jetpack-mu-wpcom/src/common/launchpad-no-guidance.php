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
	 * Setup, and any other site has none when it was created past the cutoff. A staging site goes by its production
	 * site's creation, since it gets a blog ID of its own.
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

		// WordPress.com persists the production blog ID on Atomic staging sites when it clones them, JSON-encoded.
		if ( $blog_id && class_exists( 'Atomic_Persistent_Data' ) ) {
			$persistent_data    = new Atomic_Persistent_Data();
			$production_blog_id = (int) json_decode( (string) $persistent_data->WPCOM_PRODUCTION_BLOG_ID ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName
			if ( $production_blog_id ) {
				$blog_id = $production_blog_id;
			}
		}

		return $blog_id && wpcom_launchpad_is_past_no_guidance_cutoff( $blog_id );
	}
}
