/* eslint-disable jsdoc/require-returns, jsdoc/require-param-description */

import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { JetpackSeoRoutes, JetpackSeoSections } from '../../constants';
import type { Severity } from './severity-dot';
import type { OverviewResponse } from '../../data/overview-types';

export type GuideStatus = 'done' | 'moderate' | 'critical';

export interface GuideAction {
	label: string;
	onClick?: () => void;
	href?: string;
	external?: boolean;
	inline?: 'enable_sitemap' | 'enable_llms_txt';
}

export interface GuideItem {
	id: string;
	status: GuideStatus;
	title: string;
	hint?: string;
	action?: GuideAction;
}

const RANK: Record< GuideStatus, number > = { critical: 0, moderate: 1, done: 2 };

// Map a GuideStatus back onto the visual severity scale used by SeverityDot
// — `done` collapses to the healthy dot.
export const toSeverity = ( status: GuideStatus ): Severity => {
	if ( status === 'critical' ) return 'critical';
	if ( status === 'moderate' ) return 'moderate';
	return 'healthy';
};

const discoverabilityHref = `${ JetpackSeoRoutes.Settings }#${ JetpackSeoSections.Discoverability }`;
const verificationHref = `${ JetpackSeoRoutes.Settings }#${ JetpackSeoSections.Verification }`;

/**
 * The Overview screen's setup guide. Intentionally limited to one-time,
 * stable configuration items — sitemap, search engine access, front-page
 * description, verification, llms.txt, AI crawlers. Post-level content
 * issues live in the Content SEO health card instead, so completing the
 * guide sticks even as posts are added and edited.
 *
 * Returns an empty list when `data` is still loading so the guide can
 * render a skeleton without callers having to guard the hook.
 * @param data
 */
const useGuideItems = ( data?: OverviewResponse ): GuideItem[] => {
	return useMemo( () => {
		if ( ! data ) {
			return [];
		}
		const items: GuideItem[] = [];
		const visibility = data.site_visibility;
		const ai = data.ai_discoverability;
		const verification = data.site_verification;

		// --- Critical: search engines blocked ---------------------------
		if ( ! visibility.search_engines_visible ) {
			items.push( {
				id: 'search-engines-blocked',
				status: 'critical',
				title: __( 'Allow search engines to crawl the site', 'jetpack-seo' ),
				hint: __(
					'WordPress is set to discourage search engines. No page on this site can rank.',
					'jetpack-seo'
				),
				action: {
					label: __( 'Open reading settings', 'jetpack-seo' ),
					href: '/wp-admin/options-reading.php',
					external: true,
				},
			} );
		}

		// --- Sitemap (setup + critical if off) --------------------------
		items.push(
			visibility.sitemap_active
				? {
						id: 'sitemap',
						status: 'done',
						title: __( 'XML sitemap is published', 'jetpack-seo' ),
				  }
				: {
						id: 'sitemap',
						status: 'critical',
						title: __( 'Enable the XML sitemap', 'jetpack-seo' ),
						hint: __(
							'Search engines use the sitemap to discover new and updated pages.',
							'jetpack-seo'
						),
						action: {
							label: __( 'Enable sitemap', 'jetpack-seo' ),
							inline: 'enable_sitemap',
						},
				  }
		);

		// --- Front-page description (setup) -----------------------------
		items.push(
			visibility.front_page_description
				? {
						id: 'front-page',
						status: 'done',
						title: __( 'Front-page description is set', 'jetpack-seo' ),
				  }
				: {
						id: 'front-page',
						status: 'moderate',
						title: __( 'Write the front-page description', 'jetpack-seo' ),
						hint: __(
							'The home page is usually the most-linked page on the site — set a meta description so you control its snippet.',
							'jetpack-seo'
						),
						action: {
							label: __( 'Set description', 'jetpack-seo' ),
							href: JetpackSeoRoutes.Settings,
						},
				  }
		);

		// --- Verification (setup) --------------------------------------
		const verifiedCount = Object.values( verification ).filter( Boolean ).length;
		items.push(
			verifiedCount > 0
				? {
						id: 'verification',
						status: 'done',
						title: __( 'Site is verified', 'jetpack-seo' ),
				  }
				: {
						id: 'verification',
						status: 'moderate',
						title: __( 'Verify the site on at least one search engine', 'jetpack-seo' ),
						hint: __(
							'Verify on Google to unlock Search Console reporting and index visibility.',
							'jetpack-seo'
						),
						action: {
							label: __( 'Verify site', 'jetpack-seo' ),
							href: verificationHref,
						},
				  }
		);

		// --- llms.txt (setup) ------------------------------------------
		items.push(
			ai.llms_txt_enabled
				? {
						id: 'llms-txt',
						status: 'done',
						title: __( 'llms.txt is published for AI assistants', 'jetpack-seo' ),
				  }
				: {
						id: 'llms-txt',
						status: 'moderate',
						title: __( 'Publish llms.txt for AI assistants', 'jetpack-seo' ),
						hint: __(
							'Without llms.txt, assistants have to guess which pages to prioritize.',
							'jetpack-seo'
						),
						action: {
							label: __( 'Enable llms.txt', 'jetpack-seo' ),
							inline: 'enable_llms_txt',
						},
				  }
		);

		// --- AI crawlers reviewed (setup) ------------------------------
		const anyCrawlerDecision = Object.values( ai.crawlers ).some( v => v === 'block' );
		items.push(
			anyCrawlerDecision
				? {
						id: 'ai-crawlers',
						status: 'done',
						title: __( 'AI crawler settings reviewed', 'jetpack-seo' ),
				  }
				: {
						id: 'ai-crawlers',
						status: 'moderate',
						title: __( 'Review AI crawler settings', 'jetpack-seo' ),
						hint: __(
							'Decide which AI bots can read your content. Blocking at least one confirms you have made a choice.',
							'jetpack-seo'
						),
						action: {
							label: __( 'Review crawlers', 'jetpack-seo' ),
							href: discoverabilityHref,
						},
				  }
		);

		items.sort( ( a, b ) => RANK[ a.status ] - RANK[ b.status ] );
		return items;
	}, [ data ] );
};

export default useGuideItems;
