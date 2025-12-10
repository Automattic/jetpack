import { BaseChartProps } from '../../types';

export interface GeoChartProps
	extends Pick< BaseChartProps, 'className' | 'data' | 'chartId' | 'width' | 'height' > {
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
