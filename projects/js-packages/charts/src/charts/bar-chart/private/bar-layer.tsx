import { BarGroup, BarSeries, DataContext } from '@visx/xychart';
import { useContext } from 'react';
import ClassifiedBarSeries from './classified-bar-series';
import { getValueScalePosition } from './comparison-bars-geometry';
import { SelectedBarRing } from './selected-bar-ring';
import SlottedBarSeries from './slotted-bar-series';
import StackedBarSeries from './stacked-bar-series';
import type { ValueScale } from './comparison-bars-geometry';
import type { SelectedBar } from './selected-bar-ring';
import type { BarSlots } from './use-bar-slots';
import type { DataPointDate, SeriesData } from '../../../types';
import type { BarChartProps } from '../types';
import type { AxisScale } from '@visx/axis';
import type { SeriesProps } from '@visx/xychart';
import type { FC, ReactNode } from 'react';

type Accessors = Pick<
	SeriesProps< AxisScale, AxisScale, DataPointDate >,
	'xAccessor' | 'yAccessor'
>;

type Props = Accessors & {
	chartId: string;
	barSlots: BarSlots | undefined;
	selectedBar: SelectedBar | undefined;
	primaryEntries: { series: SeriesData; index: number }[];
	primaryKeys: string[];
	getBarBackground: ( index: number ) => ( datum: DataPointDate ) => string;
	barClassName: BarChartProps[ 'barClassName' ];
	groupPadding: number;
	horizontal: boolean;
};

/**
 * Wraps the stacked bars so the entrance animation grows them from the zero line.
 *
 * Reading the scales here, not in `BarLayer`, keeps the series' own data registration from re-rendering it in a loop.
 *
 * @param props            - Component props.
 * @param props.horizontal - Whether the bars run horizontally.
 * @param props.children   - The stacked series.
 * @return The group.
 */
const StackedBarGroup: FC< { horizontal: boolean; children: ReactNode } > = ( {
	horizontal,
	children,
} ) => {
	const { xScale, yScale } = useContext( DataContext );
	const valueScale = ( horizontal ? xScale : yScale ) as ValueScale | undefined;
	const zero = valueScale ? getValueScalePosition( valueScale, 0 ) : 0;

	return (
		<g
			className="visx-bar-group"
			data-testid="bar-chart-stack-group"
			style={ { transformOrigin: horizontal ? `${ zero }px 0` : `0 ${ zero }px` } }
		>
			{ children }
		</g>
	);
};

/**
 * Draws the bars in front of any comparison shadows, stacked or slotted in the layout's slots and grouped by visx otherwise, then the selected bar's ring.
 *
 * @param props                  - Component props.
 * @param props.chartId          - The chart's id, which keeps the ring's clip path unique on a page with several charts.
 * @param props.barSlots         - The overlap or stacked slots, or undefined for a grouped layout.
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
	barSlots,
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
	if ( barSlots?.kind === 'stacked' ) {
		bars = (
			<StackedBarGroup horizontal={ horizontal }>
				{ barSlots.entries.map( ( { series, index } ) => (
					<StackedBarSeries
						key={ series.label }
						dataKey={ series.label }
						data={ series.data as DataPointDate[] }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						colorAccessor={ getBarBackground( index ) }
						barClassName={ barClassName }
						slotKeys={ barSlots.slotKeys }
						slotKey={ barSlots.slotOf( series.label ) }
						groupPadding={ groupPadding }
						stack={ barSlots.stack }
					/>
				) ) }
			</StackedBarGroup>
		);
	} else if ( barSlots ) {
		bars = (
			<g className="visx-bar-group">
				{ barSlots.entries.map( ( { series, index } ) => (
					<SlottedBarSeries
						key={ series.label }
						dataKey={ series.label }
						data={ series.data as DataPointDate[] }
						xAccessor={ xAccessor }
						yAccessor={ yAccessor }
						colorAccessor={ getBarBackground( index ) }
						barClassName={ barClassName }
						slotKeys={ barSlots.slotKeys }
						slotKey={ barSlots.slotOf( series.label ) }
						thickness={ barSlots.thicknessOf( series.label ) }
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
					slotKeys={ barSlots?.slotKeys ?? primaryKeys }
					groupPadding={ groupPadding }
					horizontal={ horizontal }
					xAccessor={ xAccessor }
					yAccessor={ yAccessor as ( datum: DataPointDate ) => number | undefined }
				/>
			) }
		</>
	);
};
