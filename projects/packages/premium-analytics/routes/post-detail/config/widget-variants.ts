/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { link, mapMarker, megaphone, desktop, seen } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import type { WidgetTypeAlias } from '../../widget-type-aliases';

/**
 * Page-local aliases for the fixed post-detail compositions; see
 * `WidgetTypeAlias` for why a fixed composition aliases at all. A variant may
 * replace the base type's help note when the page pins it to a window the base
 * note doesn't describe.
 */
export const POST_DETAIL_WIDGET_TYPE_ALIASES: ReadonlyArray< WidgetTypeAlias > = [
	{
		baseType: 'jpa/email-time-series',
		variants: [
			{
				name: 'jpa/email-time-series--total-opens',
				getTitle: () => __( 'Opens, first 30 days', 'jetpack-premium-analytics-pkg' ),
				getHelp: () => ( {
					content: __(
						'Daily opens for the 30 days after this email was sent. The totals above are all-time.',
						'jetpack-premium-analytics-pkg'
					),
				} ),
				icon: seen,
			},
			{
				name: 'jpa/email-time-series--total-clicks',
				getTitle: () => __( 'Clicks, first 30 days', 'jetpack-premium-analytics-pkg' ),
				getHelp: () => ( {
					content: __(
						'Daily clicks for the 30 days after this email was sent. The totals above are all-time.',
						'jetpack-premium-analytics-pkg'
					),
				} ),
				icon: link,
			},
		],
	},
	{
		baseType: 'jpa/email-breakdown',
		variants: [
			{
				name: 'jpa/email-breakdown--location-opens',
				getTitle: () => __( 'Locations', 'jetpack-premium-analytics-pkg' ),
				icon: mapMarker,
			},
			{
				name: 'jpa/email-breakdown--platforms-opens',
				getTitle: () => __( 'Platforms', 'jetpack-premium-analytics-pkg' ),
				icon: desktop,
			},
			{
				name: 'jpa/email-breakdown--clients-opens',
				getTitle: () => __( 'Clients', 'jetpack-premium-analytics-pkg' ),
			},
			{
				name: 'jpa/email-breakdown--location-clicks',
				getTitle: () => __( 'Locations', 'jetpack-premium-analytics-pkg' ),
				icon: mapMarker,
			},
			{
				name: 'jpa/email-breakdown--platforms-clicks',
				getTitle: () => __( 'Platforms', 'jetpack-premium-analytics-pkg' ),
				icon: desktop,
			},
			{
				name: 'jpa/email-breakdown--clients-clicks',
				getTitle: () => __( 'Clients', 'jetpack-premium-analytics-pkg' ),
			},
			{
				name: 'jpa/email-breakdown--top-links',
				getTitle: () => __( 'Top links', 'jetpack-premium-analytics-pkg' ),
				icon: link,
			},
		],
	},
	{
		baseType: 'jpa/utm-insights',
		variants: [
			{
				name: 'jpa/utm-insights--utm',
				getTitle: () => __( 'UTM', 'jetpack-premium-analytics-pkg' ),
				icon: megaphone,
			},
		],
	},
];
