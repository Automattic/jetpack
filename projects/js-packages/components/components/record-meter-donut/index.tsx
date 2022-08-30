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
	 * Label to be used for the given item.
	 * If not provided, defaults to "record meter donut chart"
	 */
	label?: string;
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
	// label = 'record meter donut chart',
	backgroundColor = '#00BA37', // jetpack green
	thickness = '3.5',
} ) => {
	const count = () => {
		// get count as a percent value
		return ( segmentCount / totalCount ) * 100;
	};

	return (
		<div className="svg-item">
			<svg width="100%" height="100%" viewBox="0 0 40 40" className="donut">
				<circle
					className="donut-hole"
					cx="20"
					cy="20"
					r="15.91549430918954"
					fill="transparent"
				></circle>
				<circle
					className="donut-ring"
					cx="20"
					cy="20"
					r="15.91549430918954"
					fill="transparent"
					stroke-width={ thickness }
				></circle>
				<circle
					className="donut-segment"
					cx="20"
					cy="20"
					r="15.91549430918954"
					fill="transparent"
					stroke={ backgroundColor }
					stroke-width={ thickness }
					stroke-dasharray={ `${ count() } ${ 100 - count() }` }
					stroke-dashoffset="25"
				></circle>
			</svg>
		</div>
	);
};

export default RecordMeterDonut;
