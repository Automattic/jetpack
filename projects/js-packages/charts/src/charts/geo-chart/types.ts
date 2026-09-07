import { BaseChartProps, GeoData } from '../../types';

/**
 * Region to display on the map.
 * Use 'world' for global view or any ISO 3166-1 alpha-2 country code
 * (e.g., 'US' for United States, 'CA' for Canada).
 */
export type GeoRegion = 'world' | ( string & {} );

/**
 * Resolution level for the map.
 * - 'countries': Country-level (default for 'world')
 * - 'provinces': State/province level (use with specific region like 'US')
 * - 'metros': Metropolitan areas (US only)
 */
export type GeoResolution = 'countries' | 'provinces' | 'metros';

export interface GeoChartError {
	id?: string;
	message?: string;
	detailedMessage?: string;
	options?: Record< string, unknown >;
}

export interface GeoChartProps
	extends Pick< BaseChartProps, 'className' | 'chartId' | 'width' | 'height' > {
	/**
	 * Data in Google Charts native format for maximum flexibility.
	 * First row contains column headers, subsequent rows contain data.
	 *
	 * Country identifiers can be either full country names or ISO 3166-1 alpha-2 codes
	 * (e.g., 'United States' or 'US').
	 */
	data: GeoData;
	/**
	 * Region to display. Use 'world' for global view, 'US' for United States,
	 * or any ISO 3166-1 alpha-2 country code.
	 * @default 'world'
	 */
	region?: GeoRegion;
	/**
	 * Resolution level for the map.
	 * - 'countries': Country-level (default for 'world')
	 * - 'provinces': State/province level (use with specific region like 'US')
	 * - 'metros': Metropolitan areas (US only)
	 * @default 'countries'
	 */
	resolution?: GeoResolution;
	/**
	 * Callback fired when Google Charts emits a chart error.
	 */
	onError?: ( error: GeoChartError ) => void;
	/**
	 * Optional render function for the loading placeholder.
	 * Called while Google Charts is loading.
	 */
	renderPlaceholder?: () => React.ReactNode;
}
