/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { SearchTermRow } from './aggregate';
import type { Field } from '@wordpress/dataviews';

/**
 * DataViews field config for the Search terms records table.
 *
 * @return The field config.
 */
export function getSearchTermsFields(): Field< SearchTermRow >[] {
	return [
		{
			id: 'term',
			label: __( 'Search term', 'jetpack-premium-analytics' ),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: true,
			enableHiding: false,
			getValue: ( { item } ) => item.term,
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics' ),
			type: 'integer',
			enableSorting: true,
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => <>{ item.views.toLocaleString() }</>,
		},
	];
}
