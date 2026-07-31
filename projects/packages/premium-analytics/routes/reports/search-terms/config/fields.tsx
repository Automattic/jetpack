/**
 * External dependencies
 */
import { MetricWithComparison } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { SearchTermRow } from './aggregate';
import type { Field } from '@wordpress/dataviews';

const VIEWS_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

/**
 * DataViews field config for the Search terms records table.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getSearchTermsFields( withComparison = false ): Field< SearchTermRow >[] {
	return [
		{
			id: 'term',
			label: __( 'Search term', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: true,
			enableHiding: false,
			getValue: ( { item } ) => item.term,
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
			enableSorting: true,
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
