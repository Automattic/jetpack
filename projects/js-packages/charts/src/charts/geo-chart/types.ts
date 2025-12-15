import { BaseChartProps, GeoData } from '../../types';

export interface GeoChartProps
	extends Pick< BaseChartProps, 'className' | 'chartId' | 'width' | 'height' > {
	/**
	 * Record mapping country IDs (ISO 3166-1 alpha-3 codes) to numeric values
	 */
	data: GeoData;
	/**
	 * Optional render function for the loading placeholder.
	 * Called while Google Charts is loading.
	 */
	renderPlaceholder?: () => React.ReactNode;
}
