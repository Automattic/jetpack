/**
 * External dependencies
 */
import { DrilldownLeafCell, safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { LeaderboardLabel, MetricWithComparison } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import type { Field } from '@wordpress/dataviews';

/**
 * A flattened referrer group, source, or domain shown in the records table.
 */
export type ReferrerRecord = {
	id: string;
	parentId?: string;
	parentLabel?: string;
	label: string;
	views: number;
	previousValue?: number;
	link?: string;
	icon?: string;
	hasChildren?: boolean;
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

				// Group/source rows keep DataViews' title treatment and never link
				// away; only leaf referrers use the drilldown leaf treatment.
				if ( item.hasChildren ) {
					return label;
				}

				return (
					<DrilldownLeafCell groupLabel={ item.parentLabel }>
						{ safeUrl ? (
							<Link href={ safeUrl } openInNewTab rel="noopener noreferrer">
								{ label }
							</Link>
						) : (
							label
						) }
					</DrilldownLeafCell>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ item.previousValue }
					dataFormat={ {
						type: 'number',
						options: { decimals: 0, useMultipliers: false },
					} }
					fontSize="md"
				/>
			),
		},
	];
}
