/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { __ } from '@wordpress/i18n';
import type { StatsFileDownloadsItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

/**
 * The visible file label, preferring the filename supplied by the endpoint.
 *
 * @param item - A normalized file-download row.
 * @return The file label.
 */
function getFileLabel( item: StatsFileDownloadsItem ): string {
	return item.shortLabel ?? String( item.label ?? '' );
}

/**
 * DataViews fields for the File downloads records table.
 *
 * @return The field config.
 */
export function getDownloadsFields(): Field< StatsFileDownloadsItem >[] {
	return [
		{
			id: 'file',
			label: __( 'File', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => getFileLabel( item ),
			render: ( { item } ) => {
				const label = getFileLabel( item );
				const href = safeHttpUrl( item.link );

				if ( ! href ) {
					return <>{ label }</>;
				}

				return (
					<a href={ href } target="_blank" rel="noopener noreferrer">
						{ label }
					</a>
				);
			},
		},
		{
			id: 'downloads',
			label: __( 'Downloads', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.downloads,
			render: ( { item } ) => (
				<>
					{ formatMetricValue( item.downloads, 'number', {
						decimals: 0,
						useMultipliers: false,
					} ) }
				</>
			),
		},
	];
}
