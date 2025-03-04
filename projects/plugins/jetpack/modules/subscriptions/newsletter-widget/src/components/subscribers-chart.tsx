import { curveMonotoneX } from '@visx/curve';
import { ParentSize } from '@visx/responsive';
import { Axis, Grid, LineSeries, Tooltip, XYChart } from '@visx/xychart';
import type { DailyCount, SubscriptionStat } from '../types';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';

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
const renderGlyph = ( { key, color, x, y } ) => {
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

	// TODO: Clean up styles
	return (
		<div>
			<div style={ { fontWeight: 600, marginBottom: '5px' } }>{ formatDate( date, 'full' ) }</div>
			<div style={ { display: 'flex', flexDirection: 'column', gap: '2px' } }>
				<div style={ { display: 'flex', alignItems: 'center' } }>
					<div
						style={ {
							width: '8px',
							height: '8px',
							borderRadius: '50%',
							backgroundColor: seriesColors.all,
							marginRight: '5px',
						} }
					/>
					<span>All: { getAllSubscribers( datum ) }</span>
				</div>
				<div style={ { display: 'flex', alignItems: 'center' } }>
					<div
						style={ {
							width: '8px',
							height: '8px',
							borderRadius: '50%',
							backgroundColor: seriesColors.email,
							marginRight: '5px',
						} }
					/>
					<span>Email: { getEmailSubscribers( datum ) }</span>
				</div>
				<div style={ { display: 'flex', alignItems: 'center' } }>
					<div
						style={ {
							width: '8px',
							height: '8px',
							borderRadius: '50%',
							backgroundColor: seriesColors.paid,
							marginRight: '5px',
						} }
					/>
					<span>Paid: { getPaidSubscribers( datum ) }</span>
				</div>
			</div>
		</div>
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
							margin={ { top: 12, right: 12, bottom: 12 + 19, left: 12 + 27 } }
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

							<Axis orientation="left" hideAxisLine numTicks={ 5 } />

							<Axis
								orientation="bottom"
								tickFormat={ formatAxisTickDate }
								hideAxisLine
								numTicks={ 5 }
							/>

							<Tooltip< SubscriptionStat >
								showVerticalCrosshair
								showSeriesGlyphs
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
