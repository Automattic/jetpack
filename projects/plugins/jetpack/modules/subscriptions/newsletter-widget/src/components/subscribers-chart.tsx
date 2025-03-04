import { curveMonotoneX } from '@visx/curve';
import { ParentSize } from '@visx/responsive';
import { Axis, Grid, LineSeries, Tooltip, XYChart } from '@visx/xychart';
import type { DailyCount, SubscriptionStat } from '../types';
import type {
	RenderTooltipGlyphProps,
	RenderTooltipParams,
} from '@visx/xychart/lib/components/Tooltip';

// TODO: Do a translation pass on this file
// TODO: Write tests

type SubscribersChartProps = {
	countsByDay: Record< string, DailyCount >;
};

// TODO: Do we need to internationalize this?
const formatDate = ( date: Date, format: 'short' | 'full' = 'short' ) => {
	if ( format === 'short' ) {
		// Format as "Jan 5"
		return date.toLocaleDateString( undefined, { month: 'short', day: 'numeric' } );
	}

	// Format as "Jan 5, 2023"
	return date.toLocaleDateString( undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	} );
};

const formatAxisTickDate = ( date: unknown ) => formatDate( date as Date, 'short' );
const getXAxisTickValues = ( data: SubscriptionStat[] ) => {
	if ( data.length < 2 ) return data.map( d => d.date );

	// Get first and last dates
	const firstDate = data[ 0 ].date;
	const lastDate = data[ data.length - 1 ].date;

	// Calculate total time span in milliseconds
	const timeSpan = lastDate.getTime() - firstDate.getTime();

	// Calculate evenly spaced points at 0%, 25%, 50%, 75%, and 100% of the time span
	return [
		firstDate,
		new Date( firstDate.getTime() + timeSpan * 0.25 ),
		new Date( firstDate.getTime() + timeSpan * 0.5 ),
		new Date( firstDate.getTime() + timeSpan * 0.75 ),
		lastDate,
	];
};

// Transform the data to the format expected by XYChart
const transformData = ( countsByDay: Record< string, DailyCount > ): SubscriptionStat[] => {
	const entries = Object.entries( countsByDay )
		.map( ( [ dateStr, counts ] ) => ( {
			date: new Date( dateStr ),
			all: counts.all,
			email: counts.email,
			paid: counts.paid,
		} ) )
		.sort( ( a, b ) => a.date.getTime() - b.date.getTime() );

	// Calculate cumulative totals
	let allTotal = 0;
	let emailTotal = 0;
	let paidTotal = 0;

	return entries.map( entry => {
		allTotal += entry.all;
		emailTotal += entry.email;
		paidTotal += entry.paid;

		return {
			date: entry.date,
			all: allTotal,
			email: emailTotal,
			paid: paidTotal,
		};
	} );
};

// Chart accessors
const getDate = ( d: SubscriptionStat ) => d.date;
const getAllSubscribers = ( d: SubscriptionStat ) => d.all;
const getEmailSubscribers = ( d: SubscriptionStat ) => d.email;
const getPaidSubscribers = ( d: SubscriptionStat ) => d.paid;

const seriesColors = {
	all: '#2db85c',
	email: '#3057dc',
	paid: '#e68b28',
};

// Custom rendering for tooltip glyphs to match the line colors
const renderGlyph = ( { key, color, x, y }: RenderTooltipGlyphProps< SubscriptionStat > ) => {
	const fillColor = seriesColors[ key ] || color;

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
					<div className="subscribers-chart__tooltip-indicator subscribers-chart__tooltip-indicator--all" />
					<span>All: { getAllSubscribers( datum ) }</span>
				</div>
				<div className="subscribers-chart__tooltip-stat">
					<div className="subscribers-chart__tooltip-indicator subscribers-chart__tooltip-indicator--email" />
					<span>Email: { getEmailSubscribers( datum ) }</span>
				</div>
				<div className="subscribers-chart__tooltip-stat">
					<div className="subscribers-chart__tooltip-indicator subscribers-chart__tooltip-indicator--paid" />
					<span>Paid: { getPaidSubscribers( datum ) }</span>
				</div>
			</div>
		</>
	);
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
						>
							<Grid columns={ false } numTicks={ 5 } />

							<LineSeries
								dataKey="all"
								data={ data }
								xAccessor={ getDate }
								yAccessor={ getAllSubscribers }
								stroke={ seriesColors.all }
								strokeWidth={ 2 }
								curve={ curveMonotoneX }
							/>

							<LineSeries
								dataKey="email"
								data={ data }
								xAccessor={ getDate }
								yAccessor={ getEmailSubscribers }
								stroke={ seriesColors.email }
								strokeWidth={ 2 }
								curve={ curveMonotoneX }
							/>

							<LineSeries
								dataKey="paid"
								data={ data }
								xAccessor={ getDate }
								yAccessor={ getPaidSubscribers }
								stroke={ seriesColors.paid }
								strokeWidth={ 2 }
								curve={ curveMonotoneX }
							/>

							<Axis
								orientation="left"
								hideAxisLine
								hideZero
								numTicks={ 5 }
								tickLabelProps={ { fill: '#3c434a', fontSize: '13px', fontWeight: '400' } }
							/>

							<Axis
								orientation="bottom"
								tickFormat={ formatAxisTickDate }
								hideAxisLine
								numTicks={ 5 }
								tickValues={ getXAxisTickValues( data ) }
								tickLabelProps={ { fill: '#3c434a', fontSize: '13px', fontWeight: '400' } }
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
