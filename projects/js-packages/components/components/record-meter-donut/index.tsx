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
	 * Color code for the background color for the item
	 */
	backgroundColor: string;
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
					stroke-width="3.5"
				></circle>
				<circle
					className="donut-segment donut-segment-2"
					cx="20"
					cy="20"
					r="15.91549430918954"
					fill="transparent"
					stroke-width="3.5"
					stroke-dasharray={ `${ items[ 0 ].count } ${ totalCount - items[ 0 ].count }` }
					stroke-dashoffset="25"
				></circle>
			</svg>
		</div>
	);
};

export default RecordMeterDonut;
