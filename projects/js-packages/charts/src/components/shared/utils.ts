import { getStringWidth } from '@visx/text';
import { format } from 'd3-format';
import { SeriesData } from '../../types';

const DEFAULT_FORMAT = format( ',' ); // Default: 1,234
const DEFAULT_LABEL_WIDTH = 40;

/**
 * Returns a d3-format function for Y-axis ticks based on the data's value range.
 * - Uses SI notation for thousands, millions, billions.
 * - Falls back to comma-separated format for smaller numbers.
 *
 * @param {SeriesData['data']} data - Array of data points.
 * @return {(value: number) => string} - d3-format function.
 */
export const formatYTick = ( data: SeriesData[ 'data' ] ) => {
	if ( ! Array.isArray( data ) || data.length === 0 ) {
		return DEFAULT_FORMAT;
	}

	const maxAbs = Math.max( ...data.map( d => Math.abs( Number( d.value ) || 0 ) ) );

	if ( maxAbs >= 1e9 ) {
		return format( ',.3s' ); // Billions: 1.23G
	}
	if ( maxAbs >= 1e6 ) {
		return format( ',.2s' ); // Millions: 1.2M
	}
	if ( maxAbs >= 1e3 ) {
		return format( ',.1s' ); // Thousands: 1k
	}

	return DEFAULT_FORMAT;
};

/**
 * Returns the width of the longest label in the data.
 *
 * @param {SeriesData['data']} data       - Array of data points.
 * @param {Function}           tickFormat - Function to format the data points.
 * @param {object}             labelStyle - Style object for the label.
 * @return {number} - Width of the longest label.
 */
export const getLongestLabelWidth = (
	data: SeriesData[ 'data' ],
	tickFormat: ( value: number ) => string,
	labelStyle?: object
) => {
	if ( ! data || data.length === 0 ) {
		return DEFAULT_LABEL_WIDTH;
	}

	const values = data.map( d => d.value );
	const maxValue = Math.max( ...values );
	const minValue = Math.min( ...values );

	const formattedMaxValue = tickFormat( maxValue );
	const formattedMinValue = tickFormat( minValue );
	const longestLabel =
		formattedMaxValue.length >= formattedMinValue.length ? formattedMaxValue : formattedMinValue;

	const stringWidth = getStringWidth( longestLabel, labelStyle );

	if ( stringWidth ) {
		return stringWidth;
	}

	return DEFAULT_LABEL_WIDTH;
};
