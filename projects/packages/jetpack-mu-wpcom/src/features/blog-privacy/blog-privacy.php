<?php
/**
 * Blog Privacy Settings
 *
 * Controls for Blog Privacy are spread out over several different places.
 * * WordPress Core (all sites: `blog_privacy_selector`, `blog_public`)
 * * wpcomsh (WoA: Private Site feature)
 * * WP.com (simple: `blog_public`)
 * * This jetpack-mu-wpcom feature (WoA, simple: robots.text user agent blocks)
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
	// If the site is completely private, don't bother with the additional restrictions.
	if ( -1 === (int) $public ) {
		return $output;
	}

	// An option oddly named because of history.
	if ( get_option( 'wpcom_data_sharing_opt_out' ) ) {
		$ai_bots = array(
			'CCBot',
			'SentiBot',
			'sentibot',
			'Google-Extended',
			'FacebookBot',
			'omgili',
			'omgilibot',
			'Amazonbot',
			'Bingbot',
		);

		foreach ( $ai_bots as $ai_bot ) {
			$output .= "\nUser-agent: {$ai_bot}\n";
			$output .= "Disallow: /\n";
		}
	}

	return $output;
}

add_filter( 'robots_txt', __NAMESPACE__ . '\\robots_txt', 20, 2 );
