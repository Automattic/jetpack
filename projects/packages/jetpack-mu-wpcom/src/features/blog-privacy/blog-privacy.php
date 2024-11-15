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
	// For blog_public=0, WP.com Disallows all user agents and Core does not (relying on <meta name="robots">).
	// Let wpcom do it's thing to not clutter the robots.txt file.
	if ( -1 === $public || ( 0 === $public && defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
		return $output;
	}

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
			'meta-externalagent',
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
 * Disable the Open Graph Tags based on the value of either wpcom_public_coming_soon option.
 */
function remove_og_tags() {
	if ( ! (bool) get_option( 'wpcom_public_coming_soon' ) ) {
		return;
	}

	// Disable Jetpack Open Graph Tags.
	add_filter( 'jetpack_enable_open_graph', '__return_false', 99 );

	// Disable Yoast SEO. See https://developer.yoast.com/customization/yoast-seo/disabling-yoast-seo/.
	if ( function_exists( 'YoastSEO' ) && class_exists( 'Yoast\WP\SEO\Integrations\Front_End_Integration', false ) ) {
		// @phan-suppress-next-line PhanUndeclaredFunction, PhanUndeclaredClassReference
		$front_end = \YoastSEO()->classes->get( \Yoast\WP\SEO\Integrations\Front_End_Integration::class );
		remove_action( 'wpseo_head', array( $front_end, 'present_head' ), -9999 );
	}
}

add_action( 'wp_head', __NAMESPACE__ . '\remove_og_tags', 0 );
