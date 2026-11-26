/**
 * External dependencies
 */
import {
	ExternalLink,
	MetricWithComparison,
	safeHttpUrl,
	type ArchiveRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import type { Field } from '@jetpack-premium-analytics/externals';

const VIEWS_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

/**
 * The fields of the archives table. A getter, so the labels translate after the locale data loads.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getArchivesFields( withComparison = false ): Field< ArchiveRow >[] {
	return [
		{
			id: 'title',
			label: __( 'Title', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				const href = safeHttpUrl( item.link );

				if ( ! href ) {
					return <>{ item.label }</>;
				}

				return <ExternalLink href={ href }>{ item.label }</ExternalLink>;
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ withComparison ? item.previousViews : undefined }
					dataFormat={ VIEWS_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
	];
}
