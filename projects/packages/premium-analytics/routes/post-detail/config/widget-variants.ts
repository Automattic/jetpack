/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { link, mapMarker, megaphone, desktop, seen } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import type { WidgetIcon } from '@wordpress/widget-primitives';

/**
 * Page-local aliases of registered widget types for the fixed post-detail
 * compositions. The widget host titles a card by its widget *type*, so one
 * type rendered several times would repeat one generic title; each alias
 * reuses the resolved base type's render module under a design title (and,
 * where the mocks call for one, its own icon) instead. The aliases exist only
 * in this page's `widgetTypes` — the post detail page is a fixed composition
 * with no widget gallery, so they can never be picked elsewhere.
 *
 * Labels are lazy getters so translations resolve after the i18n locale data
 * has loaded, mirroring the tab definitions. Icons are static module refs;
 * variants without one inherit the base type's icon.
 */
export const POST_DETAIL_WIDGET_TYPE_ALIASES: ReadonlyArray< {
	baseType: `jpa/${ string }`;
	variants: ReadonlyArray< {
		name: `jpa/${ string }`;
		getTitle: () => string;
		icon?: WidgetIcon;
	} >;
} > = [
	{
		baseType: 'jpa/email-time-series',
		variants: [
			{
				name: 'jpa/email-time-series--total-opens',
				getTitle: () => __( 'Total opens', 'jetpack-premium-analytics-pkg' ),
				icon: seen,
			},
			{
				name: 'jpa/email-time-series--total-clicks',
				getTitle: () => __( 'Total clicks', 'jetpack-premium-analytics-pkg' ),
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
