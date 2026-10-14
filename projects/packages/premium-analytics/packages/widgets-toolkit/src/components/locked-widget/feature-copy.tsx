/**
 * External dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ExternalLink } from '../external-link';
import type { ReactNode } from 'react';

const TRAFFIC_SUPPORT_URL = 'https://jetpack.com/support/jetpack-stats/traffic-dashboard/';

/**
 * Each feature's sentence and support link, worded as classic Stats words its upsell.
 * A function, so the strings translate once the locale has loaded.
 *
 * @return The copy, keyed by feature.
 */
function getFeatureCopy(): Record< string, { text: string; href: string } > {
	return {
		'top-posts': {
			text: __(
				'Discover your <link>post and pages</link> traffic in detail and learn what content resonates the most.',
				'jetpack-premium-analytics-pkg'
			),
			href: `${ TRAFFIC_SUPPORT_URL }#analyzing-popular-posts-and-pages`,
		},
		referrers: {
			text: __(
				'Find out where your <link>visitors come from</link> to optimize your content strategy.',
				'jetpack-premium-analytics-pkg'
			),
			href: `${ TRAFFIC_SUPPORT_URL }#referrers`,
		},
		countries: {
			text: __(
				'Discover where your <link>visitors are located</link> and identify where your traffic is coming from.',
				'jetpack-premium-analytics-pkg'
			),
			href: `${ TRAFFIC_SUPPORT_URL }#countries`,
		},
		'regions-cities': {
			text: __(
				'Access to <link>region and city stats</link> for more accurate analysis.',
				'jetpack-premium-analytics-pkg'
			),
			href: `${ TRAFFIC_SUPPORT_URL }#countries`,
		},
		clicks: {
			text: __(
				'Learn what <link>external links</link> your visitors click on your site to reveal their areas of interest.',
				'jetpack-premium-analytics-pkg'
			),
			href: `${ TRAFFIC_SUPPORT_URL }#clicks`,
		},
		'file-downloads': {
			text: __(
				'Discover the most <link>downloaded files</link> by your visitors.',
				'jetpack-premium-analytics-pkg'
			),
			href: 'https://wordpress.com/support/stats/understand-your-sites-traffic/#file-downloads',
		},
		authors: {
			text: __(
				'Identify your audience’s <link>favorite writers</link> and perspectives.',
				'jetpack-premium-analytics-pkg'
			),
			href: `${ TRAFFIC_SUPPORT_URL }#authors`,
		},
		'search-terms': {
			text: __(
				'Discover the <link>terms and phrases</link> your visitors use to find your site.',
				'jetpack-premium-analytics-pkg'
			),
			href: `${ TRAFFIC_SUPPORT_URL }#search-terms`,
		},
		videos: {
			text: __(
				'Discover your <link>most popular videos</link> and find out how they performed.',
				'jetpack-premium-analytics-pkg'
			),
			href: 'https://jetpack.com/support/jetpack-videopress/add-video-block-editor/video-stats/',
		},
		utm: {
			text: __(
				'Generate UTM parameters and track your <link>campaign performance data</link>.',
				'jetpack-premium-analytics-pkg'
			),
			href: `${ TRAFFIC_SUPPORT_URL }#harnessing-utm-stats-for-precision-tracking`,
		},
		devices: {
			text: __(
				'See which <link>devices, browsers and OS</link> your visitors are using.',
				'jetpack-premium-analytics-pkg'
			),
			href: `${ TRAFFIC_SUPPORT_URL }#devices-stats`,
		},
	};
}

/**
 * The sentence a locked feature shows, with its support link; a generic one for a feature without its own.
 *
 * @param feature - The locked feature.
 * @return The copy.
 */
export function getLockedFeatureCopy( feature?: string ): ReactNode {
	const copies = getFeatureCopy();
	const copy = feature && Object.hasOwn( copies, feature ) ? copies[ feature ] : undefined;

	if ( ! copy ) {
		return __( 'Upgrade your plan to unlock Jetpack Stats.', 'jetpack-premium-analytics-pkg' );
	}

	return createInterpolateElement( copy.text, {
		link: (
			<ExternalLink href={ copy.href } variant="default">
				{ null }
			</ExternalLink>
		),
	} );
}
