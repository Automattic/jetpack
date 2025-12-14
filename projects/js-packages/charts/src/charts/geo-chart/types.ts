import { BaseChartProps, GeoData } from '../../types';

export interface GeoChartProps
	extends Pick< BaseChartProps, 'className' | 'chartId' | 'width' | 'height' > {
	/**
	 * Record mapping country IDs (ISO 3166-1 alpha-3 codes) to numeric values
	 */
	data: GeoData;
	scale?: number;
	/**
	 * Optional render function for the loading placeholder.
	 * Called while the map topology is being loaded asynchronously.
	 */
	renderPlaceholder?: () => React.ReactNode;
}

export interface FeatureShape {
	type: 'Feature';
	id: string;
	geometry: { coordinates: [ number, number ][][]; type: 'Polygon' };
	properties: { name: string };
}

export interface TooltipData {
	countryName: string;
	countryId: string;
	value: number;
}
