import { BaseChartProps, GeoData } from '../../types';

export interface GeoChartProps
	extends Pick< BaseChartProps, 'className' | 'chartId' | 'width' | 'height' > {
	/**
	 * Record mapping country codes (ISO 3166-1 alpha-2, e.g., 'US', 'GB') to numeric values
	 */
	data: GeoData;
	/**
	 * Optional render function for the loading placeholder.
	 * Called while Google Charts is loading.
	 */
	renderPlaceholder?: () => React.ReactNode;
}
