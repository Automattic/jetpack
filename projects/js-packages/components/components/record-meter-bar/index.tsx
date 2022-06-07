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
	/**
	 * The formatting style for legend item display. If not provided, it defaults to showing legend label after count
	 */
	showLegendLabelBeforeCount?: boolean;
	/**
	 * The sort style for legend item. If not provided, it defaults to no sorting.
	 */
	sortByCount?: 'ascending' | 'descending';
};

/**
 * Generate Record Meter bar
 *
 * @param {RecordMeterBarProps} props - Props
 * @returns {React.ReactElement} - JSX element
 */
const RecordMeterBar: React.FC< RecordMeterBarProps > = ( {
	totalCount,
	items = [],
	showLegendLabelBeforeCount = false,
	sortByCount,
} ) => {
	const total = useMemo( () => {
		// If total count is not given, then compute it from items' count
		return (
			totalCount ||
			items.reduce( ( currentTotal, { count } ) => {
				return currentTotal + count;
			}, 0 )
		);
	}, [ items, totalCount ] );

	const itemsToRender = useMemo( () => {
		if ( sortByCount ) {
			// create a new array because .sort() updates the array in place.
			return [ ...items ].sort( ( a, z ) => {
				return 'ascending' === sortByCount ? a.count - z.count : z.count - a.count;
			} );
		}
		return items;
	}, [ items, sortByCount ] );

	return (
		<div className="record-meter-bar">
			<div className="record-meter-bar__items">
				{ itemsToRender.map( ( { count, label, backgroundColor } ) => {
					const widthPercent = ( ( count / total ) * 100 ).toPrecision( 2 );
					return (
						<div key={ label } style={ { backgroundColor, flexBasis: `${ widthPercent }%` } }></div>
					);
				} ) }
			</div>
			<div className="record-meter-bar__legend">
				<ul className="record-meter-bar__legend--items">
					{ itemsToRender.map( ( { count, label, backgroundColor } ) => {
						return (
							<li key={ label } className="record-meter-bar__legend--item">
								<div
									className="record-meter-bar__legend--item-circle"
									style={ { backgroundColor } }
								/>
								{ ! showLegendLabelBeforeCount && (
									<span>
										<span className="record-meter-bar__legend--item-count">{ count }</span>
										<span className="record-meter-bar__legend--item-label">{ label }</span>
									</span>
								) }
								{ showLegendLabelBeforeCount && (
									<span>
										<span className="record-meter-bar__legend--item-label record-meter-bar__legend--item-label-first">
											{ label }
										</span>
										<span className="record-meter-bar__legend--item-count">({ count })</span>
									</span>
								) }
							</li>
						);
					} ) }
				</ul>
			</div>
		</div>
	);
};

export default RecordMeterBar;
