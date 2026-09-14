/**
 * External dependencies
 */
import { GeoChart, type GeoChartError } from '@jetpack-premium-analytics/externals';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import { RESIZE_DEBOUNCE_MS } from '../../constants';
import { buildLocationsGeoChart } from './build-geo-data';
import type { LocationsGeoFocusCountry, LocationsGeoMode, LocationsGeoRow } from './build-geo-data';

type GoogleChartsWindow = Window & {
	google?: {
		visualization?: {
			errors?: {
				removeError?: ( errorId: string ) => void;
			};
		};
	};
};

// Google GeoChart has no `provinces` map for some countries (e.g. TW, SG) and no
// upstream list exists, so each is learned on a failed draw and cached across remounts.
const runtimeUnsupportedProvinceMapCountries = new Set< string >();

export interface LocationsGeoChartProps {
	/** The locations to plot. Rows are summed up to countries where the map cannot place them. */
	rows: LocationsGeoRow[];
	/** Granularity of the rows. */
	mode: LocationsGeoMode;
	/** Country the map is scoped to, from a drill-down or a report filter. */
	focusCountry?: LocationsGeoFocusCountry;
	/** Debounce for the chart's own resize observer, in milliseconds. */
	resizeDebounceTime?: number;
}

/**
 * The shared Stats locations map: a Google GeoChart of views by location.
 *
 * A focused country is drawn as a provinces map where Google has one, and falls
 * back to the world map where it does not.
 *
 * @param {LocationsGeoChartProps} props - The component props.
 * @return The locations map.
 */
export function LocationsGeoChart( {
	rows,
	mode,
	focusCountry,
	resizeDebounceTime = RESIZE_DEBOUNCE_MS,
}: LocationsGeoChartProps ) {
	const [ unsupportedProvinceMapCountries, setUnsupportedProvinceMapCountries ] = useState<
		Set< string >
	>( () => new Set( runtimeUnsupportedProvinceMapCountries ) );

	const focusCountryCode = focusCountry?.code.toUpperCase();
	const provinceMapSupported = focusCountryCode
		? ! unsupportedProvinceMapCountries.has( focusCountryCode )
		: true;
	const { data, region, resolution } = useMemo(
		() => buildLocationsGeoChart( { rows, mode, focusCountry, provinceMapSupported } ),
		[ focusCountry, mode, provinceMapSupported, rows ]
	);
	const useProvinceMap = resolution === 'provinces';

	const handleError = useCallback(
		( error: GeoChartError ) => {
			// Only a focused Regions view redraws after a failure; anywhere else
			// Google's error element is the only signal left, so leave it be.
			if ( ! focusCountryCode || mode !== 'region' ) {
				return;
			}

			// The fallback redraw replaces the failed map, but the error element
			// Google injected would otherwise linger above it.
			if ( error.id && typeof window !== 'undefined' ) {
				( window as GoogleChartsWindow ).google?.visualization?.errors?.removeError?.( error.id );
			}

			// Any error during a provinces draw triggers the fallback (the message may
			// be localized); one on the fallback map is a straggler from the failed draw.
			if ( ! useProvinceMap ) {
				return;
			}

			runtimeUnsupportedProvinceMapCountries.add( focusCountryCode );
			setUnsupportedProvinceMapCountries( previous => {
				if ( previous.has( focusCountryCode ) ) {
					return previous;
				}

				const next = new Set( previous );
				next.add( focusCountryCode );
				return next;
			} );
		},
		[ focusCountryCode, mode, useProvinceMap ]
	);

	return (
		<GeoChart
			data={ data }
			resizeDebounceTime={ resizeDebounceTime }
			region={ region }
			resolution={ resolution }
			onError={ handleError }
		/>
	);
}
