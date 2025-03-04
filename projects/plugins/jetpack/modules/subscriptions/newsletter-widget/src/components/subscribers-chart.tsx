import { curveMonotoneX } from '@visx/curve';
import { ParentSize } from '@visx/responsive';
import { Axis, Grid, LineSeries, Tooltip, XYChart } from '@visx/xychart';
import type { DailyCount, SubscriptionStat } from '../types';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';

type SubscribersChartProps = {
	countsByDay: Record< string, DailyCount >;
};

// Format date using native JavaScript
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

// Format function for axis tick dates
const formatAxisTickDate = ( date: unknown ) => formatDate( date as Date, 'short' );

// Transform the data to the format expected by XYChart
const transformData = ( countsByDay: Record< string, DailyCount > ): SubscriptionStat[] => {
	const entries = Object.entries( countsByDay )
		.map( ( [ dateStr, counts ] ) => ( {
			date: new Date( dateStr ),
			email: counts.email,
			paid: counts.paid,
		} ) )
		.sort( ( a, b ) => a.date.getTime() - b.date.getTime() );

	// Calculate cumulative totals
	let emailTotal = 0;
	let paidTotal = 0;

	return entries.map( entry => {
		emailTotal += entry.email;
		paidTotal += entry.paid;

		return {
			date: entry.date,
			email: emailTotal,
			paid: paidTotal,
		};
	} );
};

// Chart accessors
const getDate = ( d: SubscriptionStat ) => d.date;
const getEmailSubscribers = ( d: SubscriptionStat ) => d.email;
const getPaidSubscribers = ( d: SubscriptionStat ) => d.paid;

// Properly typed tooltip renderer
const renderTooltip = ( { tooltipData }: RenderTooltipParams< SubscriptionStat > ) => {
	if ( ! tooltipData?.nearestDatum ) return null;

	const datum = tooltipData.nearestDatum.datum;
	const date = getDate( datum );

	return (
		<div
			style={ {
				background: 'white',
				padding: '8px',
				border: '1px solid #ccc',
				borderRadius: '4px',
				boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
				fontSize: '12px',
				color: '#333',
			} }
		>
			<div style={ { fontWeight: 600, marginBottom: '5px' } }>{ formatDate( date, 'full' ) }</div>
			<div style={ { display: 'flex', flexDirection: 'column', gap: '2px' } }>
				<div style={ { display: 'flex', alignItems: 'center' } }>
					<div
						style={ {
							width: '8px',
							height: '8px',
							borderRadius: '50%',
							backgroundColor: '#2271b1',
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
							backgroundColor: '#d63638',
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
				{ ( { width, height } ) => (
					<XYChart
						height={ height }
						width={ width }
						margin={ { top: 12, right: 12, bottom: 12 + 19, left: 12 + 27 } }
						xScale={ { type: 'time' } }
						yScale={ { type: 'linear', nice: true } }
					>
						<Grid columns={ false } numTicks={ 5 } />

						<LineSeries
							dataKey="Email Subscribers"
							data={ data }
							xAccessor={ getDate }
							yAccessor={ getEmailSubscribers }
							stroke="#2271b1"
							strokeWidth={ 2 }
							curve={ curveMonotoneX }
						/>

						<LineSeries
							dataKey="Paid Subscribers"
							data={ data }
							xAccessor={ getDate }
							yAccessor={ getPaidSubscribers }
							stroke="#d63638"
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
						/>
					</XYChart>
				) }
			</ParentSize>
		</div>
	);
};
