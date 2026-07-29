/**
 * External dependencies
 */
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { MetricWithComparison } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import type { StatsFileDownloadsComparisonItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

const DOWNLOADS_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

/**
 * The visible file label, preferring the filename supplied by the endpoint.
 *
 * @param item - A normalized file-download row.
 * @return The file label.
 */
function getFileLabel( item: StatsFileDownloadsComparisonItem ): string {
	return item.shortLabel ?? String( item.label ?? '' );
}

/**
 * DataViews fields for the File downloads records table.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getDownloadsFields(
	withComparison = false
): Field< StatsFileDownloadsComparisonItem >[] {
	return [
		{
			id: 'file',
			label: __( 'File', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => getFileLabel( item ),
			render: ( { item } ) => {
				const label = getFileLabel( item );
				// The endpoint falls back to a root-relative `relative_url` here.
				const href = safeHttpUrl( item.link, { allowRelative: true } );

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
			label: __( 'Downloads', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.downloads,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.downloads }
					previousValue={ withComparison ? item.previousDownloads : undefined }
					dataFormat={ DOWNLOADS_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
	];
}
