import { curveMonotoneX } from '@visx/curve';
import { ParentSize } from '@visx/responsive';
import { Axis, Grid, LineSeries, Tooltip, XYChart, buildChartTheme } from '@visx/xychart';
import { formatAxisTickDate, formatDate, getXAxisTickValues, transformData } from '../helpers';
import type { DailyCount, SubscriptionStat } from '../types';
import type {
	RenderTooltipGlyphProps,
	RenderTooltipParams,
} from '@visx/xychart/lib/components/Tooltip';

// TODO: Do a translation pass on this file
// TODO: Write tests

const SERIES_COLORS = {
	all: '#2db85c',
	email: '#3057dc',
	paid: '#e68b28',
};

const chartTheme = buildChartTheme( {
	backgroundColor: 'white',
	colors: [ SERIES_COLORS.all, SERIES_COLORS.email, SERIES_COLORS.paid ],
	gridColor: '#e0e0e0',
	gridColorDark: '#e0e0e0',
	tickLength: 0, // No tick marks
	gridStyles: {
		strokeWidth: 1,
	},
	svgLabelSmall: {
		fill: '#1e1e1e',
		fontSize: 13,
		fontWeight: 400,
	},
} );

// Chart accessors
const getDate = ( d: SubscriptionStat ) => d.date;
const getAllSubscribers = ( d: SubscriptionStat ) => d.all;
const getEmailSubscribers = ( d: SubscriptionStat ) => d.email;
const getPaidSubscribers = ( d: SubscriptionStat ) => d.paid;
const getLineColor = ( k: string ) => SERIES_COLORS[ k ];

// Custom rendering for tooltip glyphs to match the line colors
const renderGlyph = ( { key, color, x, y }: RenderTooltipGlyphProps< SubscriptionStat > ) => {
	const fillColor = SERIES_COLORS[ key ] || color;

	return (
		<circle
			key={ `glyph-${ key }` }
			cx={ x }
			cy={ y }
			r={ 4 }
			fill={ fillColor }
			stroke="white"
			strokeWidth={ 2 }
		/>
	);
};

const renderTooltip = ( { tooltipData }: RenderTooltipParams< SubscriptionStat > ) => {
	if ( ! tooltipData?.nearestDatum ) return null;

	const datum = tooltipData.nearestDatum.datum;
	const date = getDate( datum );

	return (
		<>
			<div className="subscribers-chart__tooltip-date">{ formatDate( date, 'full' ) }</div>
			<div className="subscribers-chart__tooltip-stats">
				<div className="subscribers-chart__tooltip-stat">
					<div
						style={ { backgroundColor: SERIES_COLORS.all } }
						className="subscribers-chart__tooltip-indicator"
					/>
					<span>All: { getAllSubscribers( datum ) }</span>
				</div>
				<div className="subscribers-chart__tooltip-stat">
					<div
						style={ { backgroundColor: SERIES_COLORS.email } }
						className="subscribers-chart__tooltip-indicator"
					/>
					<span>Email: { getEmailSubscribers( datum ) }</span>
				</div>
				<div className="subscribers-chart__tooltip-stat">
					<div
						style={ { backgroundColor: SERIES_COLORS.paid } }
						className="subscribers-chart__tooltip-indicator"
					/>
					<span>Paid: { getPaidSubscribers( datum ) }</span>
				</div>
			</div>
		</>
	);
};

type SubscribersChartProps = {
	countsByDay: Record< string, DailyCount >;
};

export const SubscribersChart = ( { countsByDay }: SubscribersChartProps ) => {
	if ( Object.keys( countsByDay ).length === 0 ) {
		return <div>No data available</div>;
	}

	const data = transformData( countsByDay );

	return (
		<div className="subscribers-chart">
			<ParentSize>
				{ ( { width, height } ) => {
					if ( ! width || ! height ) return null;

					return (
						<XYChart
							height={ height }
							width={ width }
							xScale={ { type: 'time' } }
							yScale={ { type: 'linear', nice: true } }
							theme={ chartTheme }
						>
							<Grid columns={ false } numTicks={ 5 } />

							<LineSeries
								dataKey="all"
								data={ data }
								xAccessor={ getDate }
								yAccessor={ getAllSubscribers }
								colorAccessor={ getLineColor }
								strokeWidth={ 2 }
								curve={ curveMonotoneX }
							/>

							<LineSeries
								dataKey="email"
								data={ data }
								xAccessor={ getDate }
								yAccessor={ getEmailSubscribers }
								colorAccessor={ getLineColor }
								strokeWidth={ 2 }
								curve={ curveMonotoneX }
							/>

							<LineSeries
								dataKey="paid"
								data={ data }
								xAccessor={ getDate }
								yAccessor={ getPaidSubscribers }
								colorAccessor={ getLineColor }
								strokeWidth={ 2 }
								curve={ curveMonotoneX }
							/>

							<Axis orientation="left" hideAxisLine hideTicks hideZero numTicks={ 5 } />

							<Axis
								orientation="bottom"
								tickFormat={ formatAxisTickDate }
								hideAxisLine
								hideTicks
								numTicks={ 5 }
								tickValues={ getXAxisTickValues( data ) }
							/>

							<Tooltip< SubscriptionStat >
								showVerticalCrosshair
								showSeriesGlyphs
								className="subscribers-chart__tooltip"
								renderTooltip={ renderTooltip }
								renderGlyph={ renderGlyph }
							/>
						</XYChart>
					);
				} }
			</ParentSize>
		</div>
	);
};
