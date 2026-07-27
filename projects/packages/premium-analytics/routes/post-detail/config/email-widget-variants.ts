/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Page-local aliases of registered widget types for the fixed email
 * compositions. The widget host titles a card by its widget *type*, so one
 * type rendered several times would repeat one generic title; each alias
 * reuses the resolved base type's render module under a design title instead.
 * The aliases exist only in this page's `widgetTypes` — the post detail page
 * is a fixed composition with no widget gallery, so they can never be picked
 * elsewhere.
 *
 * Labels are lazy getters so translations resolve after the i18n locale data
 * has loaded, mirroring the tab definitions.
 */
export const EMAIL_WIDGET_TYPE_ALIASES: ReadonlyArray< {
	baseType: `jpa/${ string }`;
	variants: ReadonlyArray< {
		name: `jpa/${ string }`;
		getTitle: () => string;
	} >;
} > = [
	{
		baseType: 'jpa/email-time-series',
		variants: [
			{
				name: 'jpa/email-time-series--total-opens',
				getTitle: () => __( 'Total opens', 'jetpack-premium-analytics-pkg' ),
			},
			{
				name: 'jpa/email-time-series--total-clicks',
				getTitle: () => __( 'Total clicks', 'jetpack-premium-analytics-pkg' ),
			},
		],
	},
	{
		baseType: 'jpa/email-breakdown',
		variants: [
			{
				name: 'jpa/email-breakdown--location-opens',
				getTitle: () => __( 'Location opens', 'jetpack-premium-analytics-pkg' ),
			},
			{
				name: 'jpa/email-breakdown--platforms-opens',
				getTitle: () => __( 'Platforms opens', 'jetpack-premium-analytics-pkg' ),
			},
			{
				name: 'jpa/email-breakdown--clients-opens',
				getTitle: () => __( 'Clients opens', 'jetpack-premium-analytics-pkg' ),
			},
			{
				name: 'jpa/email-breakdown--location-clicks',
				getTitle: () => __( 'Location clicks', 'jetpack-premium-analytics-pkg' ),
			},
			{
				name: 'jpa/email-breakdown--platforms-clicks',
				getTitle: () => __( 'Platforms clicks', 'jetpack-premium-analytics-pkg' ),
			},
			{
				name: 'jpa/email-breakdown--clients-clicks',
				getTitle: () => __( 'Clients clicks', 'jetpack-premium-analytics-pkg' ),
			},
			{
				name: 'jpa/email-breakdown--top-links',
				getTitle: () => __( 'Top links', 'jetpack-premium-analytics-pkg' ),
			},
		],
	},
];
