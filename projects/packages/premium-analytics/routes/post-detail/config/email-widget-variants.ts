/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/** The registered widget type the email cards alias. */
export const EMAIL_BREAKDOWN_TYPE = 'jpa/email-breakdown';

/**
 * Page-local aliases of `jpa/email-breakdown` for the fixed email
 * compositions. The widget host titles a card by its widget *type*, so one
 * type rendered seven times would repeat one generic title; each alias reuses
 * the resolved type's render module under a design title instead. The aliases
 * exist only in this page's `widgetTypes` — the post detail page is a fixed
 * composition with no widget gallery, so they can never be picked elsewhere.
 *
 * Labels are lazy getters so translations resolve after the i18n locale data
 * has loaded, mirroring the tab definitions.
 */
export const EMAIL_BREAKDOWN_TYPE_VARIANTS: ReadonlyArray< {
	name: `jpa/${ string }`;
	getTitle: () => string;
} > = [
	{
		name: 'jpa/email-breakdown--location-opens',
		getTitle: () => __( 'Location opens', 'jetpack-premium-analytics' ),
	},
	{
		name: 'jpa/email-breakdown--platforms-opens',
		getTitle: () => __( 'Platforms opens', 'jetpack-premium-analytics' ),
	},
	{
		name: 'jpa/email-breakdown--clients-opens',
		getTitle: () => __( 'Clients opens', 'jetpack-premium-analytics' ),
	},
	{
		name: 'jpa/email-breakdown--location-clicks',
		getTitle: () => __( 'Location clicks', 'jetpack-premium-analytics' ),
	},
	{
		name: 'jpa/email-breakdown--platforms-clicks',
		getTitle: () => __( 'Platforms clicks', 'jetpack-premium-analytics' ),
	},
	{
		name: 'jpa/email-breakdown--clients-clicks',
		getTitle: () => __( 'Clients clicks', 'jetpack-premium-analytics' ),
	},
	{
		name: 'jpa/email-breakdown--top-links',
		getTitle: () => __( 'Top links', 'jetpack-premium-analytics' ),
	},
];
