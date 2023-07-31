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
 * @param {string} color - The color of the series.
 * @returns {object} The series information object.
 */
function createSerieInfo( label: string, color: string ) {
	const { spline } = uPlot.paths;
	return {
		label: label,
		stroke: color,
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
 * UplotLineChart component.
 *
 * @param {object} props - The props object for the UplotLineChart component.
 * @param {uPlot.AlignedData} props.data - The data for the uPlot chart.
 * @returns {React.Element} The JSX element representing the UplotLineChart component.
 */
export default function UplotLineChart( { data }: UplotChartProps ) {
	const uplot = useRef< uPlot | null >( null );
	const uplotContainer = useRef( null );

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
				createSerieInfo( __( 'Desktop', 'jetpack' ), '#3373BE' ),
				createSerieInfo( __( 'Mobile', 'jetpack' ), '#069E08' ),
			],
			legend: {
				show: false,
			},
			plugins: [ tooltipsPlugin() ],
		};
		return {
			...defaultOptions,
		};
	}, [] );

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
