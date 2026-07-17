/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { DrilldownLeafCell, safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import type { Field } from '@wordpress/dataviews';

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
};

/**
 * DataViews field config for the Clicks records table.
 *
 * @return The field config.
 */
export function getClicksFields(): Field< ClickRow >[] {
	return [
		{
			id: 'clickedUrl',
			label: __( 'Clicked URL', 'jetpack-premium-analytics' ),
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
					<DrilldownLeafCell>
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
			label: __( 'Clicks', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.clicks,
			render: ( { item } ) => (
				<>{ formatMetricValue( item.clicks, 'number', { decimals: 0, useMultipliers: false } ) }</>
			),
		},
	];
}
