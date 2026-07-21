/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { LeaderboardLabel } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { Field } from '@wordpress/dataviews';

/**
 * A flattened referrer leaf shown in the records table.
 */
export type ReferrerRecord = {
	id: string;
	label: string;
	group: string;
	views: number;
	link?: string;
	icon?: string;
};

/**
 * DataViews field config for the Referrers records table.
 *
 * @return The field config.
 */
export function getReferrerFields(): Field< ReferrerRecord >[] {
	return [
		{
			id: 'referrer',
			label: __( 'Referrer', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				const label = (
					<LeaderboardLabel
						label={ item.label }
						imageUrl={ item.icon }
						imageAlt=""
						imageFallback="hidden"
						imageClassName={ styles.referrerIcon }
					/>
				);
				const safeUrl = safeHttpUrl( item.link );

				if ( ! safeUrl ) {
					return label;
				}

				return (
					<a href={ safeUrl } target="_blank" rel="noopener noreferrer">
						{ label }
					</a>
				);
			},
		},
		{
			id: 'group',
			label: __( 'Group', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			getValue: ( { item } ) => item.group,
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<>{ formatMetricValue( item.views, 'number', { decimals: 0, useMultipliers: false } ) }</>
			),
		},
	];
}
