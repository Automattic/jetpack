import { __ } from '@wordpress/i18n';
import React from 'react';
import './style.scss';
export type RecordMeterDonutProps = {
	/**
	 * Total number of items for the record meter donut.
	 */
	totalCount: number;
	/**
	 * Count for the given item
	 */
	segmentCount: number;
	/**
	 * Color code for the background color for the item.
	 * If not provided, defaults to Jetpack Green
	 */
	backgroundColor?: string;

	/**
	 * thickness for the chart border
	 * If not provided, defaults to 3.5
	 */
	thickness?: string;
	/**
	 * width for the full chart size
	 * If not provided, defaults to 64px
	 */
	donutWidth?: string;
};

/**
 * Generate record meter donut bar
 *
 * @param {RecordMeterDonutProps} props - Props
 * @returns {React.ReactElement} - JSX element
 */
const RecordMeterDonut: React.FC< RecordMeterDonutProps > = ( {
	totalCount,
	segmentCount,
	backgroundColor = '#00BA37', // jetpack green fallback
	thickness = '3.5',
	donutWidth = '64px',
} ) => {
	const count = () => {
		// get count as a percent value
		return ( segmentCount / totalCount ) * 100;
	};

	return (
		<div className="record-meter-donut" aria-hidden="true">
			<svg
				width={ donutWidth }
				height="auto"
				viewBox="0 0 40 40"
				className="record-meter-donut_svg"
				data-testid="record-meter-donut_svg"
			>
				<circle
					className="record-meter-donut-hole"
					cx="20" // center x value of circle
					cy="20" // center y value of circle
					r="15.91549430918954" // radius based on the circumference r = 100/(2π)
					fill="transparent"
				></circle>
				<circle
					className="record-meter-donut-ring"
					cx="20"
					cy="20"
					r="15.91549430918954"
					fill="transparent"
					strokeWidth={ thickness }
					stroke="#ebebeb"
				></circle>
				<circle
					className="record-meter-donut-segment"
					cx="20"
					cy="20"
					r="15.91549430918954"
					fill="transparent"
					transform-origin="center"
					stroke={ backgroundColor }
					strokeWidth={ thickness }
					strokeDasharray={ `${ count() } ${ 100 - count() }` }
					strokeDashoffset="-25" // this ensures the segment begins at the bottom of the donut instead of the top
				></circle>
			</svg>
			<table className="screen-reader-text">
				<caption>{ __( 'Summary of the records', 'jetpack' ) }</caption>
				<tbody>
					<tr>
						<th scope="col">{ __( 'Current usage', 'jetpack' ) }</th>
						<th scope="col">{ __( 'Current limit', 'jetpack' ) }</th>
					</tr>
					<tr>
						<td>{ segmentCount }</td>
						<td>{ totalCount }</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};

export default RecordMeterDonut;
