/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { Field } from '@wordpress/dataviews';

/**
 * A flattened referrer leaf shown in the records table.
 */
export type ReferrerRecord = {
	id: string;
	label: string;
	group: string;
	views: number;
	link?: string;
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
				if ( ! item.link ) {
					return <>{ item.label }</>;
				}

				return (
					<a href={ item.link } target="_blank" rel="noopener noreferrer">
						{ item.label }
					</a>
				);
			},
		},
		{
			id: 'group',
			label: __( 'Group', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			getValue: ( { item } ) => item.group,
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => <>{ item.views.toLocaleString() }</>,
		},
	];
}
