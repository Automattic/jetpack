import { BaseChartProps } from '../../types';

export type ViewType = 'countries' | 'regions' | 'cities';

export interface CityData {
	id: string;
	name: string;
	lat: number;
	lng: number;
	value: number;
	countryCode?: string;
	countryName?: string;
}

export interface GeoChartProps
	extends Pick< BaseChartProps, 'className' | 'data' | 'chartId' | 'width' | 'height' > {
	citiesData?: CityData[];
	view?: ViewType;
	onViewChange?: ( view: ViewType ) => void;
}

export interface FeatureShape {
	type: 'Feature';
	id: string;
	geometry: { coordinates: [ number, number ][][]; type: 'Polygon' };
	properties: { name: string };
}

export interface TooltipData {
	countryName?: string;
	countryId?: string;
	cityName?: string;
	cityId?: string;
	value: number;
}
