/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { LeaderboardLabel } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
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
				const safeUrl = safeHttpUrl( item.link );
				const label = (
					<LeaderboardLabel
						label={ item.label }
						media={ { kind: 'favicon', url: item.icon } }
						decorativeMedia={ Boolean( safeUrl ) }
					/>
				);

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
