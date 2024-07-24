import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React, { useMemo } from 'react';
import numberFormat from '../number-format';

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
	/**
	 * Additional class name to be added to the component
	 */
	className?: string;
	/**
	 * Table caption
	 */
	tableCaption?: string;
	/**
	 * Title/label for the legend
	 */
	legendTitle?: string;
	/**
	 * Recorc type label for screen readers
	 */
	recordTypeLabel?: string;
	/**
	 * Record count label for screen readers
	 */
	recordCountLabel?: string;
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
	className,
	tableCaption,
	legendTitle,
	recordTypeLabel,
	recordCountLabel,
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
		<div className={ clsx( 'record-meter-bar', className ) }>
			<div className="record-meter-bar__items" aria-hidden="true">
				{ itemsToRender.map( ( { count, label, backgroundColor } ) => {
					const widthPercent = ( ( count / total ) * 100 ).toPrecision( 2 );
					return (
						<div key={ label } style={ { backgroundColor, flexBasis: `${ widthPercent }%` } }></div>
					);
				} ) }
			</div>
			<div className="record-meter-bar__legend" aria-hidden="true">
				{ legendTitle && <div className="record-meter-bar__legend--title">{ legendTitle }</div> }
				<ul className="record-meter-bar__legend--items">
					{ itemsToRender.map( ( { count, label, backgroundColor } ) => {
						const formattedCount = numberFormat( count );
						return (
							<li key={ label } className="record-meter-bar__legend--item">
								<div
									className="record-meter-bar__legend--item-circle"
									style={ { backgroundColor } }
								/>
								{ ! showLegendLabelBeforeCount && (
									<span>
										<span className="record-meter-bar__legend--item-count">{ formattedCount }</span>
										<span className="record-meter-bar__legend--item-label">{ label }</span>
									</span>
								) }
								{ showLegendLabelBeforeCount && (
									<span>
										<span className="record-meter-bar__legend--item-label record-meter-bar__legend--item-label-first">
											{ label }
										</span>
										<span className="record-meter-bar__legend--item-count">
											({ formattedCount })
										</span>
									</span>
								) }
							</li>
						);
					} ) }
				</ul>
			</div>
			<table className="screen-reader-text">
				<caption>{ tableCaption || __( 'Summary of the records', 'jetpack' ) }</caption>
				<tbody>
					<tr>
						<th scope="col">{ recordTypeLabel || __( 'Record type', 'jetpack' ) }</th>
						<th scope="col">{ recordCountLabel || __( 'Record count', 'jetpack' ) }</th>
					</tr>
					{ itemsToRender.map( ( { label, count } ) => {
						return (
							<tr key={ label }>
								<td>{ label }</td>
								<td>{ count }</td>
							</tr>
						);
					} ) }
				</tbody>
			</table>
		</div>
	);
};

export default RecordMeterBar;
