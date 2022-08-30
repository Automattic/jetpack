import React from 'react';
import './style.scss';

type RecordMeterDonutItem = {
	/**
	 * Count for the given item
	 */
	count: number;
	/**
	 * Label to be used for the given item
	 */
	label: string;
	/**
	 * Color code for the background color for the item.
	 * If not provided defaults to Jetpack Green
	 */
	backgroundColor?: string;

	/**
	 * thickness for the chart border
	 */
	thickness?: number;
};

export type RecordMeterDonutProps = {
	/**
	 * Total number of items for the record meter donut. If not provided, its is the sum of item.count of all items.
	 */
	totalCount?: number;
	/**
	 * The item to display in record meter donut.
	 */
	items: Array< RecordMeterDonutItem >;
};

/**
 * Generate record meter donut bar
 *
 * @param {RecordMeterDonutProps} props - Props
 * @returns {React.ReactElement} - JSX element
 */
const RecordMeterDonut: React.FC< RecordMeterDonutProps > = ( { totalCount, items = [] } ) => {
	const count = () => {
		// get count as a percent value
		return ( items[ 0 ].count / totalCount ) * 100;
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
					stroke-width={ items[ 0 ].thickness }
				></circle>
				<circle
					className="donut-segment"
					cx="20"
					cy="20"
					r="15.91549430918954"
					fill="transparent"
					stroke={ items[ 0 ].backgroundColor }
					stroke-width={ items[ 0 ].thickness }
					stroke-dasharray={ `${ count() } ${ 100 - count() }` }
					stroke-dashoffset="25"
				></circle>
			</svg>
		</div>
	);
};

export default RecordMeterDonut;
