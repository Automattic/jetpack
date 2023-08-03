import { __ } from '@wordpress/i18n';
import React, { useMemo, useRef, useCallback } from 'react';
import uPlot from 'uplot';
import UplotReact from 'uplot-react';
import { getUserLocale } from '../../lib/locale';
import numberFormat from '../number-format';
import getDateFormat from './get-date-format';
import { tooltipsPlugin } from './tooltips-plugin';
import useResize from './use-resize';
import 'uplot/dist/uPlot.min.css';

const DEFAULT_DIMENSIONS = {
	height: 300,
	width: 600,
};

interface UplotChartProps {
	data: uPlot.AlignedData;
	options?: Partial< uPlot.Options >;
	legendContainer?: React.RefObject< HTMLDivElement >;
	solidFill?: boolean;
	period?: string;
}

/**
 * Creates a series information object for uPlot based on the label and color.
 *
 * @param {string} label - The label for the series.
 * @param {number} score - The last score for the series.
 * @returns {object} The series information object.
 */
function createSerieInfo( label: string, score ) {
	const { spline } = uPlot.paths;
	return {
		label: label,
		stroke: getColor( score ),
		fill: getColor( score, true ),
		width: 2,
		paths: ( u, seriesIdx, idx0, idx1 ) => {
			return spline?.()( u, seriesIdx, idx0, idx1 ) || null;
		},
		points: {
			show: false,
		},
		value: ( self: uPlot, rawValue: number ) => {
			if ( ! rawValue ) {
				return '-';
			}

			return numberFormat( rawValue );
		},
	};
}

/**
 * Get the color value based on the score.
 *
 * @param {number} score - The score to get the color for.
 * @param {boolean} transparent - Whether to return a transparent color.
 * @returns {string} The color value.
 */
function getColor( score: number, transparent = false ) {
	let color = '#D63638'; // bad

	if ( score > 70 ) {
		color = '#069e08'; // good
	} else if ( score > 50 ) {
		color = '#faa754'; //mediocre
	}

	if ( transparent ) {
		return color + '22';
	}

	return color;
}

/**
 * UplotLineChart component.
 *
 * @param {object} props - The props object for the UplotLineChart component.
 * @param {uPlot.AlignedData} props.data - The data for the uPlot chart.
 * @returns {React.Element} The JSX element representing the UplotLineChart component.
 */
export default function UplotLineChart( { data }: UplotChartProps ) {
	const uplot = useRef< uPlot | null >( null );
	const uplotContainer = useRef( null );

	const desktopScore = data[ 1 ][ data[ 1 ].length - 1 ];
	const mobileScore = data[ 2 ][ data[ 2 ].length - 1 ];

	const options: uPlot.Options = useMemo( () => {
		const defaultOptions: uPlot.Options = {
			class: 'boost-score-graph',
			...DEFAULT_DIMENSIONS,
			tzDate: ts => uPlot.tzDate( new Date( ts * 1e3 ), 'Etc/UTC' ),
			fmtDate: ( chartDateStringTemplate: string ) => {
				return date => getDateFormat( chartDateStringTemplate, date, getUserLocale() );
			},
			axes: [
				{
					// x-axis
					grid: {
						show: false,
					},
					ticks: {
						stroke: '#50575E',
						width: 1,
						size: 3,
					},
				},
				{
					// y-axis
					side: 1,
					gap: 8,
					space: 50,
					size: 50,
					grid: {
						stroke: 'rgba(220, 220, 222, 0.5)', // #DCDCDE with 0.5 opacity
						width: 1,
					},
					ticks: {
						show: false,
					},
				},
			],
			cursor: {
				x: false,
				y: false,
			},
			series: [
				{
					label: __( 'Date', 'jetpack' ),
					value: ( self: uPlot, rawValue: number ) => {
						// outputs legend content - value available when mouse is hovering the chart
						if ( ! rawValue ) {
							return '-';
						}
						const date = new Date( rawValue * 1000 );
						return date.toLocaleDateString( getUserLocale() );
					},
				},
				createSerieInfo( __( 'Desktop', 'jetpack' ), desktopScore ),
				createSerieInfo( __( 'Mobile', 'jetpack' ), mobileScore ),
			],
			legend: {
				show: false,
			},
			plugins: [ tooltipsPlugin() ],
		};
		return {
			...defaultOptions,
		};
	}, [ desktopScore, mobileScore ] );

	useResize( uplot, uplotContainer );
	const onCreate = useCallback( chart => {
		return ( uplot.current = chart );
	}, [] );

	return (
		<div ref={ uplotContainer }>
			<UplotReact data={ data } onCreate={ onCreate } options={ options } />
		</div>
	);
}
