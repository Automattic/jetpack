import { BaseChartProps } from '../../types';

/**
 * Data format for GeoChart - maps country codes (ISO 3166-1 alpha-2) to numeric values
 */
export type GeoChartData = Record< string, number >;

export interface GeoChartProps
	extends Pick< BaseChartProps, 'className' | 'chartId' | 'width' | 'height' > {
	/**
	 * Record mapping country IDs (ISO 3166-1 alpha-2 codes) to numeric values
	 */
	data: GeoChartData;
	scale?: number;
	center?: [ number, number ]; // [longitude, latitude] for geographic center point
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
