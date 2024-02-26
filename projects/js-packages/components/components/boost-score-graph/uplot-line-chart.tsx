import { __ } from '@wordpress/i18n';
import React, { useMemo, useRef, useCallback } from 'react';
import uPlot from 'uplot';
import UplotReact from 'uplot-react';
import { getUserLocale } from '../../lib/locale';
import numberFormat from '../number-format';
import { annotationsPlugin } from './annotations-plugin';
import { dayHighlightPlugin } from './day-highlight-plugin';
import getDateFormat from './get-date-format';
import { tooltipsPlugin } from './tooltips-plugin';
import { useBoostScoreTransform } from './use-boost-score-transform';
import useResize from './use-resize';
import { type Annotation, Period } from '.';
import './style-uplot.scss';

const DEFAULT_DIMENSIONS = {
	height: 300,
	width: 600,
};

interface UplotChartProps {
	periods: Period[];
	annotations?: Annotation[];
	options?: Partial< uPlot.Options >;
	legendContainer?: React.RefObject< HTMLDivElement >;
	solidFill?: boolean;
	period?: string;
	range?: { startDate: number; endDate: number };
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
		fill: u => {
			const gradient = u.ctx.createLinearGradient( 0, 0, 0, DEFAULT_DIMENSIONS.height );
			gradient.addColorStop( 0, getColor( score, '44' ) );
			gradient.addColorStop( 1, getColor( score, '11' ) );

			return gradient;
		}, // use the gradient as fill for the series
		width: 2,
		paths: ( u, seriesIdx, idx0, idx1 ) => {
			return spline?.()( u, seriesIdx, idx0, idx1 ) || null;
		},
		points: {
			show: true,
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
 * @param {string} opacity - Whether to return a transparent color.
 * @returns {string} The color value.
 */
function getColor( score: number, opacity = 'FF' ) {
	let color = '#D63638'; // bad

	if ( score > 70 ) {
		color = '#069e08'; // good
	} else if ( score > 50 ) {
		color = '#faa754'; //mediocre
	}

	return `${ color }${ opacity }`;
}

/**
 * UplotLineChart component.
 *
 * @param {object} props - The props object for the UplotLineChart component.
 * @param {{ startDate: number, endDate: number }} props.range - The date range of the chart.
 * @param {Period[]} props.periods - The periods to display in the chart.
 * @param {Annotation[]} props.annotations - The annotations to display in the chart.
 * @returns {React.Element} The JSX element representing the UplotLineChart component.
 */
export default function UplotLineChart( { range, periods, annotations = [] }: UplotChartProps ) {
	const uplot = useRef< uPlot | null >( null );
	const uplotContainer = useRef( null );

	const width = uplotContainer.current?.clientWidth || DEFAULT_DIMENSIONS.width;

	let lastDesktopScore = 0;
	let lastMobileScore = 0;

	if ( periods.length > 0 ) {
		lastDesktopScore = periods[ periods.length - 1 ].dimensions.desktop_overall_score;
		lastMobileScore = periods[ periods.length - 1 ].dimensions.mobile_overall_score;
	}

	const data = useBoostScoreTransform( periods );

	const options: uPlot.Options = useMemo( () => {
		const defaultOptions: uPlot.Options = {
			class: 'boost-score-graph',
			height: DEFAULT_DIMENSIONS.height,
			width: width,
			tzDate: ts => uPlot.tzDate( new Date( ts * 1e3 ), 'Etc/UTC' ),
			fmtDate: ( chartDateStringTemplate: string ) => {
				return date => getDateFormat( chartDateStringTemplate, date, getUserLocale() );
			},
			padding: [ 17, 0, 17, 0 ],
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
					space: 100,
					size: 30,
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
						const date = new Date( rawValue );
						return date.toLocaleDateString( getUserLocale() );
					},
				},
				createSerieInfo( __( 'Desktop', 'jetpack' ), lastDesktopScore ),
				createSerieInfo( __( 'Mobile', 'jetpack' ), lastMobileScore ),
			],
			scales: {
				x: {
					time: true,
					auto: false,
					range: [ range.startDate / 1000, range.endDate / 1000 ],
				},
				y: {
					range: [ 0, 100 ],
					auto: false,
				},
			},
			legend: {
				show: false,
			},
			plugins: [
				annotationsPlugin( annotations ),
				tooltipsPlugin( periods ),
				dayHighlightPlugin(),
			],
		};
		return {
			...defaultOptions,
		};
	}, [
		width,
		lastDesktopScore,
		lastMobileScore,
		range.startDate,
		range.endDate,
		periods,
		annotations,
	] );

	useResize( uplot, uplotContainer );
	const onCreate = useCallback( chart => {
		return ( uplot.current = chart );
	}, [] );

	return (
		<div ref={ uplotContainer } className="boost-uplot-container">
			<UplotReact data={ data } onCreate={ onCreate } options={ options } />
		</div>
	);
}
