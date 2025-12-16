import { BaseChartProps, GeoData } from '../../types';
import type { GoogleDataTableColumnRoleType } from 'react-google-charts';

export interface GeoChartProps
	extends Pick< BaseChartProps, 'className' | 'chartId' | 'width' | 'height' > {
	/**
	 * Data in Google Charts native format for maximum flexibility.
	 * First row contains column headers, subsequent rows contain data.
	 *
	 * Country identifiers can be either full country names or ISO 3166-1 alpha-2 codes
	 * (e.g., 'United States' or 'US'). Full country names are recommended for better readability.
	 *
	 * Supports advanced Google Charts features:
	 * - Custom tooltips (text or HTML)
	 * - Formatted values separate from actual values
	 * - Multiple data columns
	 * - Cell properties and styling
	 *
	 * @example Basic usage with country names:
	 * [['Country', 'Value'], ['United States', 100], ['Canada', 50], ['United Kingdom', 75]]
	 *
	 * @example With custom text tooltips:
	 * [
	 *   ['Country', 'Value', { type: 'string', role: 'tooltip' }],
	 *   ['United States', 100, 'United States: 100 visitors'],
	 *   ['Canada', 50, 'Canada: 50 visitors']
	 * ]
	 *
	 * @example With HTML tooltips:
	 * [
	 *   ['Country', 'Value', { type: 'string', role: 'tooltip', p: { html: true } }],
	 *   ['United States', 100, '<div style="padding:8px"><b>United States</b><br/>100 visitors</div>'],
	 *   ['Canada', 50, '<div style="padding:8px"><b>Canada</b><br/>50 visitors</div>']
	 * ]
	 *
	 * @example With formatted values (display format differs from actual value):
	 * [
	 *   ['Country', 'Population'],
	 *   ['United States', { v: 331000000, f: '331M people' }],
	 *   ['Canada', { v: 38000000, f: '38M people' }]
	 * ]
	 */
	data: GeoData;
	/**
	 * Optional render function for the loading placeholder.
	 * Called while Google Charts is loading.
	 */
	renderPlaceholder?: () => React.ReactNode;
}

export type { GoogleDataTableColumnRoleType };
