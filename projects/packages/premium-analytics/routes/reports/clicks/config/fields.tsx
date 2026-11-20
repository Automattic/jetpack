/**
 * External dependencies
 */
import { DrilldownLeafCell, safeHttpUrl } from '@jetpack-premium-analytics/ui';
import {
	ExternalLink,
	MetricWithComparison,
	type ClickRow,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import type { Field } from '@jetpack-premium-analytics/externals';

const CLICKS_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

/**
 * DataViews field config for the Clicks records table.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getClicksFields( withComparison = false ): Field< ClickRow >[] {
	return [
		{
			id: 'clickedUrl',
			label: __( 'Link', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.clickedUrl,
			render: ( { item } ) => {
				// Only rows with children are titles; DataViews' title-field
				// styling applies to them as-is.
				if ( item.isGroup ) {
					return <>{ item.clickedUrl }</>;
				}

				const safeUrl = safeHttpUrl( item.href );

				return (
					// The parent row id is the click-group label; announcing
					// it restores the group context the nesting only shows
					// visually.
					<DrilldownLeafCell groupLabel={ item.parentId }>
						{ safeUrl ? (
							<ExternalLink href={ safeUrl } variant="default">
								{ item.clickedUrl }
							</ExternalLink>
						) : (
							item.clickedUrl
						) }
					</DrilldownLeafCell>
				);
			},
		},
		{
			id: 'clicks',
			label: __( 'Clicks', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.clicks,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.clicks }
					previousValue={ withComparison ? item.previousClicks : undefined }
					dataFormat={ CLICKS_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
	];
}
