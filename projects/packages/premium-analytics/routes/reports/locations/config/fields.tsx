/**
 * External dependencies
 */
import { flagUrl } from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { Field } from '@wordpress/dataviews';

export type LocationRow = {
	id: string;
	label: string;
	countryCode?: string;
	countryFull: string;
	views: number;
};

/**
 * DataViews fields for the Locations records table.
 *
 * @return The field config.
 */
export function getLocationFields(): Field< LocationRow >[] {
	return [
		{
			id: 'location',
			label: __( 'Location', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				const imageUrl = item.countryCode ? flagUrl( item.countryCode ) : null;

				return (
					<span className={ styles.location }>
						{ imageUrl && (
							<img
								className={ styles.flag }
								src={ imageUrl }
								alt={ sprintf(
									/* translators: %s is the country name. */
									__( 'Flag of %s', 'jetpack-premium-analytics-pkg' ),
									item.countryFull
								) }
							/>
						) }
						<span>{ item.label }</span>
					</span>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => <>{ item.views.toLocaleString() }</>,
		},
	];
}
