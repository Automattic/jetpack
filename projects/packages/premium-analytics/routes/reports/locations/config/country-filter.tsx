/**
 * External dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './country-filter.module.css';
import type { LocationsCountryOption } from './use-report-records';

export interface LocationsCountryFilterProps {
	/** Selectable countries, ordered by views. */
	countries: LocationsCountryOption[];
	/** The selected ISO country code, or an empty string for every country. */
	value: string;
	/** Label for the "no country selected" option, worded per tab. */
	allLabel: string;
	onChange: ( countryCode: string ) => void;
}

/**
 * The Locations report's country filter.
 *
 * Scopes the Regions and Cities tabs to one country and zooms the map to it.
 * The Countries tab does not render this — it is already the whole list.
 *
 * @param props           - The component props.
 * @param props.countries - Selectable countries, ordered by views.
 * @param props.value     - The selected ISO country code.
 * @param props.allLabel  - Label for the "every country" option.
 * @param props.onChange  - Called with the newly selected country code.
 * @return The country filter control.
 */
export function LocationsCountryFilter( {
	countries,
	value,
	allLabel,
	onChange,
}: LocationsCountryFilterProps ) {
	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			className={ styles.countryFilter }
			label={ __( 'Filter by country', 'jetpack-premium-analytics-pkg' ) }
			hideLabelFromVision
			value={ value }
			onChange={ onChange }
			options={ [
				{ label: allLabel, value: '' },
				...countries.map( country => ( { label: country.label, value: country.code } ) ),
			] }
		/>
	);
}
