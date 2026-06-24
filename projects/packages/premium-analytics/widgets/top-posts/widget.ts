/**
 * External dependencies
 */
import { reports } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';

/**
 * Widget type definition.
 */
export default {
	name: 'jpa/stats-top-posts',
	title: __( 'Top Posts & Pages', 'jetpack-premium-analytics' ),
	icon: reports,
	presentation: 'full-bleed',
};
