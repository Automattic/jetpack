/**
 * External dependencies
 */
import { flagUrl, MetricWithComparison } from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './fields.module.css';
import type { Field } from '@jetpack-premium-analytics/externals';

export type LocationRow = {
	id: string;
	label: string;
	countryCode?: string;
	countryFull: string;
	views: number;
	previousViews?: number;
};

const VIEWS_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

/**
 * One selectable country for the records table's country filter.
 */
export interface LocationsCountryOption {
	code: string;
	label: string;
}

/**
 * DataViews fields for the Locations records table.
 *
 * `countries` adds the country filter offered on the Regions and Cities tabs.
 * It is an ordinary DataViews filter: unset by default, added and removed from
 * "Add filter" like any other, and every country shows until one is picked.
 * Pass nothing on the Countries tab, which is already the whole country list.
 *
 * The country is not a column: the page's view lists only `location` and
 * `views`. The API applies the filter server-side, because it returns at most
 * 256 rows and the regions of a smaller country fall outside that global cut.
 *
 * @param countries      - Selectable countries, ordered by views.
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getLocationFields(
	countries?: LocationsCountryOption[],
	withComparison = false
): Field< LocationRow >[] {
	const countryField: Field< LocationRow >[] = countries
		? [
				{
					id: 'country',
					label: __( 'Country', 'jetpack-premium-analytics-pkg' ),
					elements: countries.map( country => ( {
						value: country.code,
						label: country.label,
					} ) ),
					filterBy: { operators: [ 'is' ] },
					enableSorting: false,
					getValue: ( { item } ) => item.countryCode ?? '',
				},
		  ]
		: [];

	return [
		...countryField,
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
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ withComparison ? item.previousViews : undefined }
					dataFormat={ VIEWS_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
	];
}
