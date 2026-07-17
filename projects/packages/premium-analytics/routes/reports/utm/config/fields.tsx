/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { getUtmTabLabel, type UtmReportTabId } from './tabs';
import type { UtmReportRow } from './aggregate';
import type { Field } from '@wordpress/dataviews';

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
			render: ( { item } ) => <>{ item.label }</>,
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => <>{ item.views.toLocaleString() }</>,
		},
	];
}
