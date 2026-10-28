import { BarGroup, BarSeries } from '@visx/xychart';
import ClassifiedBarSeries from './classified-bar-series';
import { SelectedBarRing } from './selected-bar-ring';
import SlottedBarSeries from './slotted-bar-series';
import type { SelectedBar } from './selected-bar-ring';
import type { OverlapSlots } from './use-overlap-slots';
import type { DataPointDate, SeriesData } from '../../../types';
import type { BarChartProps } from '../types';
import type { AxisScale } from '@visx/axis';
import type { SeriesProps } from '@visx/xychart';
import type { FC } from 'react';

type Accessors = Pick<
	SeriesProps< AxisScale, AxisScale, DataPointDate >,
	'xAccessor' | 'yAccessor'
>;

type Props = Accessors & {
	chartId: string;
	overlapSlots: OverlapSlots | undefined;
	selectedBar: SelectedBar | undefined;
	primaryEntries: { series: SeriesData; index: number }[];
	primaryKeys: string[];
	getBarBackground: ( index: number ) => ( datum: DataPointDate ) => string;
	barClassName: BarChartProps[ 'barClassName' ];
	groupPadding: number;
	horizontal: boolean;
};

/**
 * Draws the bars in front of any comparison shadows, slotted for an overlap layout and grouped by visx otherwise, then the selected bar's ring.
 *
 * @param props                  - Component props.
 * @param props.chartId          - The chart's id, which keeps the ring's clip path unique on a page with several charts.
 * @param props.overlapSlots     - The overlap layout, or undefined for a grouped one.
 * @param props.selectedBar      - The bar or slot the keyboard has selected.
 * @param props.primaryEntries   - The visible primary series, for a grouped layout.
 * @param props.primaryKeys      - Their labels, in group order.
 * @param props.getBarBackground - Reads a series' bar fill.
 * @param props.barClassName     - Adds classes to a bar.
 * @param props.groupPadding     - The padding between the bars of a category.
 * @param props.horizontal       - Whether the bars run horizontally.
 * @param props.xAccessor        - Reads a datum's x value.
 * @param props.yAccessor        - Reads a datum's y value.
 * @return The bars.
 */
export const BarLayer: FC< Props > = ( {
	chartId,
	overlapSlots,
	selectedBar,
	primaryEntries,
	primaryKeys,
	getBarBackground,
	barClassName,
	groupPadding,
	horizontal,
	xAccessor,
	yAccessor,
} ) => {
	let bars;
	if ( overlapSlots ) {
		bars = (
			<g className="visx-bar-group">
				{ overlapSlots.entries.map( ( { series, index } ) => (
					<SlottedBarSeries
						key={ series.label }
						dataKey={ series.label }
						data={ series.data as DataPointDate[] }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						colorAccessor={ getBarBackground( index ) }
						barClassName={ barClassName }
						slotKeys={ overlapSlots.slotKeys }
						slotKey={ overlapSlots.slotOf( series.label ) }
						thickness={ overlapSlots.thicknessOf( series.label ) }
						groupPadding={ groupPadding }
					/>
				) ) }
			</g>
		);
	} else if ( barClassName ) {
		bars = (
			<g className="visx-bar-group">
				{ primaryEntries.map( ( { series, index } ) => (
					<ClassifiedBarSeries
						key={ series.label }
						dataKey={ series.label }
						data={ series.data as DataPointDate[] }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						colorAccessor={ getBarBackground( index ) }
						barClassName={ barClassName }
						primaryKeys={ primaryKeys }
						groupPadding={ groupPadding }
					/>
				) ) }
			</g>
		);
	} else {
		bars = (
			<BarGroup padding={ groupPadding }>
				{ primaryEntries.map( ( { series, index } ) => (
					<BarSeries
						key={ series.label }
						dataKey={ series.label }
						data={ series.data as DataPointDate[] }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						colorAccessor={ getBarBackground( index ) }
					/>
				) ) }
			</BarGroup>
		);
	}

	return (
		<>
			{ bars }
			{ selectedBar && (
				<SelectedBarRing
					chartId={ chartId }
					selected={ selectedBar }
					slotKeys={ overlapSlots?.slotKeys ?? primaryKeys }
					groupPadding={ groupPadding }
					horizontal={ horizontal }
					xAccessor={ xAccessor }
					yAccessor={ yAccessor as ( datum: DataPointDate ) => number | undefined }
				/>
			) }
		</>
	);
};
