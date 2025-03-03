import { AxisBottom, AxisRight } from '@visx/axis';
import { Group } from '@visx/group';
import { useParentSize } from '@visx/responsive';
import { scaleLinear, scaleTime } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { useMemo } from '@wordpress/element';
import type { DailyCount, SubscriptionStat } from '../types';

type SubscribersChartProps = {
	countsByDay: Record< string, DailyCount >;
};

// Accessor functions
const xAccessor = d => d.date;
const yEmailAccessor = d => d.email;
const yPaidAccessor = d => d.paid;

// Pure helper functions
const getExtent = ( data, accessor ) => {
	if ( data.length === 0 ) return [ undefined, undefined ];

	let min = accessor( data[ 0 ] );
	let max = min;

	for ( let i = 1; i < data.length; i++ ) {
		const value = accessor( data[ i ] );
		if ( value < min ) min = value;
		if ( value > max ) max = value;
	}

	return [ min, max ];
};

const getMax = ( data, accessor ) => {
	if ( data.length === 0 ) return 0;

	let max = accessor( data[ 0 ] );

	for ( let i = 1; i < data.length; i++ ) {
		const value = accessor( data[ i ] );
		if ( value > max ) max = value;
	}

	return max;
};

const getMaxY = data => {
	const emailMax = getMax( data, yEmailAccessor );
	const paidMax = getMax( data, yPaidAccessor );
	return Math.max( emailMax, paidMax );
};

const formatData = ( countsByDay: Record< string, DailyCount > ): SubscriptionStat[] => {
	return Object.entries( countsByDay ).map( ( [ date, counts ] ) => ( {
		date: new Date( date ),
		email: counts.email,
		paid: counts.paid,
	} ) );
};

const convertToCumulativeData = ( data: SubscriptionStat[] ): SubscriptionStat[] => {
	const result = [ ...data ]; // Create a new array to avoid mutating the input
	let emailTotal = 0;
	let paidTotal = 0;

	for ( let i = 0; i < result.length; i++ ) {
		emailTotal += result[ i ].email;
		paidTotal += result[ i ].paid;
		result[ i ] = {
			...result[ i ],
			email: emailTotal,
			paid: paidTotal,
		};
	}

	return result;
};

export const SubscribersChart = ( { countsByDay }: SubscribersChartProps ) => {
	const { parentRef, width, height } = useParentSize();

	const margin = {
		top: 12,
		bottom: 12 + 24, // Add 24 to create space for the x-axis ticks
		left: 12,
		right: 12 + 28, // Add 28 to create space for the y-axis ticks
	};
	const xMax = width - margin.left - margin.right;
	const yMax = height - margin.top - margin.bottom;

	const subData = formatData( countsByDay );
	const cumulativeCountData = convertToCumulativeData( subData );

	const xScale = scaleTime( {
		range: [ 0, xMax ],
		domain: getExtent( cumulativeCountData, xAccessor ),
	} );

	const yScale = scaleLinear( {
		range: [ yMax, 0 ],
		domain: [ 0, getMaxY( cumulativeCountData ) ],
		nice: true, // This will round the domain to nice round numbers
	} );

	const xScaled = useMemo( () => d => xScale( d.date ), [ xScale ] );
	const yEmailScaled = useMemo( () => d => yScale( d.email ), [ yScale ] );
	const yPaidScaled = useMemo( () => d => yScale( d.paid ), [ yScale ] );

	// Handle empty data case
	if ( cumulativeCountData.length === 0 ) {
		return <div>No data available</div>;
	}

	return (
		<div className="subscribers-chart" ref={ parentRef }>
			<svg width={ width } height={ height }>
				<Group top={ margin.top } left={ margin.left }>
					<AxisRight scale={ yScale } numTicks={ 5 } left={ xMax } />
					<AxisBottom scale={ xScale } numTicks={ 5 } top={ yMax } />

					{ /* Email subscribers line */ }
					<LinePath data={ cumulativeCountData } x={ xScaled } y={ yEmailScaled } stroke="blue" />

					{ /* Paid subscribers line */ }
					<LinePath data={ cumulativeCountData } x={ xScaled } y={ yPaidScaled } stroke="orange" />
				</Group>
			</svg>
		</div>
	);
};
