/**
 * External dependencies
 */
import { DrilldownLeafCell } from '@jetpack-premium-analytics/ui';
import { MetricWithComparison } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { getUtmTabLabel, type UtmReportTabId } from './tabs';
import type { UtmReportRow } from './aggregate';
import type { Field } from '@jetpack-premium-analytics/externals';

const VIEWS_DATA_FORMAT = {
	type: 'number' as const,
	options: { decimals: 0, useMultipliers: false },
};

/**
 * DataViews fields for the UTM report records table.
 *
 * @param activeTab - The active UTM dimension tab.
 * @return The field config.
 */
export function getUtmFields( activeTab: UtmReportTabId ): Field< UtmReportRow >[] {
	return [
		{
			id: 'utmValue',
			label: getUtmTabLabel( activeTab ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				if ( item.isGroup ) {
					return <>{ item.label }</>;
				}

				return (
					<DrilldownLeafCell groupLabel={ item.groupLabel }>
						{ item.postId ? (
							<Link
								to="/post/$postId"
								params={ { postId: String( item.postId ) } as unknown as never }
							>
								{ item.label }
							</Link>
						) : (
							item.label
						) }
					</DrilldownLeafCell>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ item.previousViews }
					dataFormat={ VIEWS_DATA_FORMAT }
					fontSize="sm"
				/>
			),
		},
	];
}
