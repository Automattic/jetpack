/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { envelope } from '@wordpress/icons';

/**
 * Configurable attributes for the Emails widget. Mirrors the `attributes`
 * declared on the widget definition below; the host passes the selected values
 * through to `render.tsx`.
 */
export type EmailsAttributes = {
	/**
	 * Number of emails to show. `0` means as many as the endpoint returns (max 30).
	 */
	max?: number;
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Emails" module. Lists the most recently sent
 * emails with their open and click rates; a selector switches the displayed
 * metric. The summary endpoint reports across the whole lifetime of the site,
 * so there is no date range or comparison period.
 */
export default {
	name: 'jpa/stats-emails',
	title: __( 'Emails', 'jetpack-premium-analytics' ),
	icon: envelope,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
	],
	example: {
		attributes: {
			max: 10,
		},
	},
};
