/**
 * External dependencies
 */
import { getVideoLabel } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import type { StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

/**
 * DataViews field config for the Videos records table.
 *
 * @return The field config.
 */
export function getVideosFields(): Field< StatsVideoPlaysItem >[] {
	return [
		{
			id: 'title',
			label: __( 'Video', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => getVideoLabel( item ),
			render: ( { item } ) => {
				const title = getVideoLabel( item );

				if ( ! item.link ) {
					return <>{ title }</>;
				}

				return (
					<a href={ item.link } target="_blank" rel="noopener noreferrer">
						{ title }
					</a>
				);
			},
		},
		{
			id: 'plays',
			label: __( 'Plays', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.plays,
			render: ( { item } ) => <>{ item.plays.toLocaleString() }</>,
		},
		{
			id: 'impressions',
			label: __( 'Impressions', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.impressions,
			render: ( { item } ) => <>{ item.impressions.toLocaleString() }</>,
		},
	];
}
