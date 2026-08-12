/**
 * External dependencies
 */
import { DrilldownLeafCell } from '@jetpack-premium-analytics/ui';
import { MetricWithComparison, PostDetailLink } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
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
							<PostDetailLink postId={ item.postId } report="utm" originSection={ activeTab }>
								{ item.label }
							</PostDetailLink>
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
