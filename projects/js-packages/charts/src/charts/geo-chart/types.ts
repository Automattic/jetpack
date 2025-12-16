import { BaseChartProps, GeoData } from '../../types';

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
	 * Optional render function for the loading placeholder.
	 * Called while Google Charts is loading.
	 */
	renderPlaceholder?: () => React.ReactNode;
}
