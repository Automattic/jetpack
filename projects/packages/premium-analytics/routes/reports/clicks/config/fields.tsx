/**
 * External dependencies
 */
import { DrilldownLeafCell, safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { MetricWithComparison } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import type { Field } from '@wordpress/dataviews';

const CLICKS_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

export type ClickRow = {
	id: string;
	/** The click-group parent row id; unset on group rows and single-URL groups. */
	parentId?: string;
	clickedUrl: string;
	/** The external URL; group parent rows have none. */
	href?: string;
	/** Group parent rows keep the title-field styling; leaf rows opt out. */
	isGroup?: boolean;
	clicks: number;
	/** Click count for the matching row in the comparison period. */
	previousClicks?: number;
};

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
			label: __( 'Clicked URL', 'jetpack-premium-analytics-pkg' ),
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
							<Link href={ safeUrl } openInNewTab rel="noopener noreferrer">
								{ item.clickedUrl }
							</Link>
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
