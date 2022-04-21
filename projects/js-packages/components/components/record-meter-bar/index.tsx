/**
 * External dependencies
 */
import React, { useMemo } from 'react';

import './style.scss';

type RecordMeterBarItem = {
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

export type RecordMeterBarProps = {
	/**
	 * Total number of items for the record meter. If not provided, its is the sum of item.count of all items.
	 */
	totalCount?: number;
	/**
	 * The items to display in Record meter.
	 */
	items: Array< RecordMeterBarItem >;
};

/**
 * Generate Record Meter bar
 *
 * @param {RecordMeterBarProps} props - Props
 * @returns {React.ReactElement} - JSX element
 */
const RecordMeterBar: React.FC< RecordMeterBarProps > = ( { totalCount, items = [] } ) => {
	const total = useMemo( () => {
		// If total count is not given, then compute it from items' count
		return (
			totalCount ||
			items.reduce( ( currentTotal, { count } ) => {
				return currentTotal + count;
			}, 0 )
		);
	}, [ items, totalCount ] );

	return (
		<div className="record-meter-bar">
			<div className="record-meter-bar__items">
				{ items.map( ( { count, label, backgroundColor } ) => {
					const widthPercent = ( ( count / total ) * 100 ).toPrecision( 2 );
					return (
						<div key={ label } style={ { backgroundColor, flexBasis: `${ widthPercent }%` } }></div>
					);
				} ) }
			</div>
			<div className="record-meter-bar__legend">
				<ul className="record-meter-bar__legend--items">
					{ items.map( ( { count, label, backgroundColor } ) => {
						return (
							<li key={ label } className="record-meter-bar__legend--item">
								<div
									className="record-meter-bar__legend--item-circle"
									style={ { backgroundColor } }
								/>
								<span className="record-meter-bar__legend--item-count">{ count }</span>
								<span className="record-meter-bar__legend--item-label">{ label }</span>
							</li>
						);
					} ) }
				</ul>
			</div>
		</div>
	);
};

export default RecordMeterBar;
