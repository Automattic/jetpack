/**
 * External dependencies
 */
import { GeoChart, type GeoChartError } from '@automattic/charts';
import { useCallback, useMemo, useState } from 'react';
/**
 * Internal dependencies
 */
import {
	buildLocationsMapView,
	type LocationsGeoChartRow,
	type LocationsGeoCountry,
	type LocationsGeoMode,
} from './build-locations-map-view';

type GoogleChartsWindow = Window & {
	google?: {
		visualization?: {
			errors?: {
				removeError?: ( errorId: string ) => void;
			};
		};
	};
};

const MISSING_MAP_ERROR_MESSAGE = 'Requested map does not exist';

// Google GeoChart has no `provinces` map file for some countries (e.g. TW, SG).
// There is no upstream list of them; each is learned at runtime when its
// provinces draw fails, via the GeoChart `onError` callback. This module-level
// cache carries what was learned across remounts, so within one page load each
// country pays the failed draw (a brief error flash) at most once.
const runtimeUnsupportedProvinceMapCountries = new Set< string >();

export interface LocationsGeoChartProps {
	/**
	 * The location rows to draw.
	 */
	rows: LocationsGeoChartRow[];
	/**
	 * How the rows are grouped.
	 */
	geoMode: LocationsGeoMode;
	/**
	 * The drilled-into country, on surfaces that support drill-down. Leave
	 * unset on surfaces that do not; `region` rows then roll up to countries.
	 */
	selectedCountry?: LocationsGeoCountry;
	/**
	 * Debounce, in ms, before the map redraws on a container resize.
	 */
	resizeDebounceTime?: number;
	className?: string;
}

/**
 * The shared Locations map.
 *
 * Wraps `<GeoChart>` with the row-to-map-view conversion and the provinces-map
 * fallback that both the Locations widget and the Locations report page need.
 * See `buildLocationsMapView` for which view each geo mode draws.
 *
 * @param props                    - The component props.
 * @param props.rows               - The location rows to draw.
 * @param props.geoMode            - How the rows are grouped.
 * @param props.selectedCountry    - The drilled-into country, if any.
 * @param props.resizeDebounceTime - Redraw debounce, in ms, on a resize.
 * @param props.className          - Additional class for the chart container.
 * @return The rendered Locations map.
 */
export function LocationsGeoChart( {
	rows,
	geoMode,
	selectedCountry,
	resizeDebounceTime,
	className,
}: LocationsGeoChartProps ) {
	const [ unsupportedProvinceMapCountries, setUnsupportedProvinceMapCountries ] = useState<
		ReadonlySet< string >
	>( () => new Set( runtimeUnsupportedProvinceMapCountries ) );

	const selectedCountryCode = selectedCountry?.code.toUpperCase();
	const mapView = useMemo(
		() =>
			buildLocationsMapView( {
				rows,
				geoMode,
				selectedCountry,
				unsupportedProvinceMapCountries,
			} ),
		[ rows, geoMode, selectedCountry, unsupportedProvinceMapCountries ]
	);
	const { usesProvinceMap } = mapView;

	const handleGeoChartError = useCallback(
		( error: GeoChartError ) => {
			const message = `${ error.message ?? '' } ${ error.detailedMessage ?? '' }`;
			// Any error during a provinces draw means this country's map is unusable —
			// fall back regardless of the message text, which Google may localize.
			// Stragglers from that failed draw keep arriving after the surface already
			// switched to the fallback map (resize and drill-down layout shifts each
			// redraw), so a selected country already learned as unsupported also
			// qualifies without depending on the message. The English message match
			// stays only as a last resort for errors arriving outside those states.
			const isProvinceDrawError = !! selectedCountryCode && usesProvinceMap;
			const isKnownUnsupportedProvinceDraw =
				!! selectedCountryCode && runtimeUnsupportedProvinceMapCountries.has( selectedCountryCode );

			if (
				! isProvinceDrawError &&
				! isKnownUnsupportedProvinceDraw &&
				! message.includes( MISSING_MAP_ERROR_MESSAGE )
			) {
				return;
			}

			// Clear the error element Google injected into the chart container; the
			// fallback redraw replaces the failed map, but the error element would
			// otherwise linger above it.
			if ( error.id && typeof window !== 'undefined' ) {
				( window as GoogleChartsWindow ).google?.visualization?.errors?.removeError?.( error.id );
			}

			if ( ! isProvinceDrawError ) {
				return;
			}

			runtimeUnsupportedProvinceMapCountries.add( selectedCountryCode );
			setUnsupportedProvinceMapCountries( previous => {
				if ( previous.has( selectedCountryCode ) ) {
					return previous;
				}

				const next = new Set( previous );
				next.add( selectedCountryCode );
				return next;
			} );
		},
		[ selectedCountryCode, usesProvinceMap ]
	);

	return (
		<GeoChart
			data={ mapView.data }
			region={ mapView.region }
			resolution={ mapView.resolution }
			resizeDebounceTime={ resizeDebounceTime }
			onError={ handleGeoChartError }
			className={ className }
		/>
	);
}
