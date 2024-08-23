<?php
/**
 * Blog Privacy Settings
 *
 * Controls for Blog Privacy are spread out over several different places.
 * * WordPress Core (all sites: `blog_privacy_selector`, `blog_public`)
 * * wpcomsh (WoA: Private Site feature)
 * * WP.com (simple: `blog_public`)
 * * This jetpack-mu-wpcom feature (WoA, simple: `wpcom_data_sharing_opt_out` robots.txt user agent blocks)
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Blog_Privacy;

/**
 * Filters the robots.txt contents based on the value of the wpcom_data_sharing_opt_out option.
 *
 * @param string     $output The contents of robots.txt.
 * @param int|string $public The value of the blog_public option.
 * @return string
 */
function robots_txt( string $output, $public ): string {
	$public = (int) $public;

	// If the site is completely private, don't bother with the additional restrictions.
	if ( -1 === $public ) {
		return $output;
	}

	// For blog_public=0, WP.com Disallows all user agents and Core does not (relying on <meta name="robots">).
	// Always add Disallow blocks for blog_public=0 even on WP.com where it may be redundant.
	// An option oddly named because of history.
	if ( 0 === $public || get_option( 'wpcom_data_sharing_opt_out' ) ) {
		$ai_bots = array(
			'Amazonbot',
			'anthropic-ai',
			'Applebot-Extended',
			'Bytespider',
			'CCBot',
			'ClaudeBot',
			'FacebookBot',
			'Google-Extended',
			'GPTBot',
			'omgili',
			'omgilibot',
			'PerplexityBot',
			'SentiBot',
			'sentibot',
		);

		foreach ( $ai_bots as $ai_bot ) {
			$output .= "\nUser-agent: {$ai_bot}\n";
			$output .= "Disallow: /\n";
		}
	}

	return $output;
}

add_filter( 'robots_txt', __NAMESPACE__ . '\\robots_txt', 12, 2 );

/**
 * Disable the Open Graph Tags based on the value of either wpcom_public_coming_soon and wpcom_data_sharing_opt_out option.
 */
function remove_og_tags() {
	if ( ! (bool) get_option( 'wpcom_public_coming_soon' ) && ! (bool) get_option( 'wpcom_data_sharing_opt_out' ) ) {
		return;
	}

	// Disable Jetpack Open Graph Tags.
	if ( function_exists( 'jetpack_og_tags' ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunctionInCallable
		remove_action( 'wp_head', 'jetpack_og_tags' );
	}

	// Avoid calling check_open_graph as it registers the jetpack_og_tags function when running wp_head action.
	if ( class_exists( '\Jetpack', false ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunction, PhanUndeclaredClassReference
		$jetpack = \Jetpack::init();
		remove_action( 'wp_head', array( $jetpack, 'check_open_graph' ), 1 );
	}

	// Disable Yoast SEO. See https://developer.yoast.com/customization/yoast-seo/disabling-yoast-seo/.
	if ( function_exists( 'YoastSEO' ) && class_exists( 'Yoast\WP\SEO\Integrations\Front_End_Integration', false ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunction, PhanUndeclaredClassReference
		$front_end = \YoastSEO()->classes->get( \Yoast\WP\SEO\Integrations\Front_End_Integration::class );
		remove_action( 'wpseo_head', array( $front_end, 'present_head' ), -9999 );
	}
}

add_action( 'wp_head', __NAMESPACE__ . '\remove_og_tags', 0 );
