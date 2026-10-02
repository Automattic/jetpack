import { getFormatter, getMaxTicksForWidth, getTimeAxisTickValues } from '../time-axis';
import type { SeriesData, TickResolution } from '../../../types';

// Tick placement depends on the shape of the data, not just its values, and a
// hand-written fixture only covers the shapes someone thought of. Sweep the
// shapes instead, and assert what has to hold for every one of them.

const HOUR = 3600 * 1000;
const ZONES = [ 'UTC', 'Asia/Tokyo', 'America/New_York', 'Australia/Lord_Howe', 'Pacific/Chatham' ];
const RESOLUTIONS: ( TickResolution | undefined )[] = [
	undefined,
	'hour',
	'day',
	'week',
	'month',
	'year',
];
const SHAPES = [ 'even', 'gap', 'burst', 'scattered', 'repeated', 'minutes' ] as const;

// A seeded generator, so a failure names a run that reproduces.
let seed = 1;
const random = () => ( seed = ( seed * 1103515245 + 12345 ) % 2147483648 ) / 2147483648;
const oneOf = < T >( values: readonly T[] ): T => values[ Math.floor( random() * values.length ) ];

const makeDates = (): Date[] => {
	const start = Date.UTC(
		2025,
		Math.floor( random() * 12 ),
		1 + Math.floor( random() * 27 ),
		Math.floor( random() * 24 )
	);
	const shape = oneOf( SHAPES );
	const stepHours = oneOf( [ 1, 6, 24, 24 * 7, 24 * 30 ] );
	const count = 1 + Math.floor( random() * 200 );
	const times: number[] = [];

	for ( let index = 0; index < count; index++ ) {
		switch ( shape ) {
			case 'gap':
				times.push( start + ( index < count / 2 ? index : index + 500 ) * stepHours * HOUR );
				break;
			case 'burst':
				times.push(
					start + Math.floor( index / 5 ) * stepHours * 50 * HOUR + ( index % 5 ) * HOUR
				);
				break;
			case 'scattered':
				times.push( start + Math.floor( random() * 5000 ) * HOUR );
				break;
			case 'repeated':
				times.push( start + Math.floor( index / 3 ) * stepHours * HOUR );
				break;
			case 'minutes':
				times.push( start + index * 60 * 1000 );
				break;
			default:
				times.push( start + index * stepHours * HOUR );
		}
	}

	return times.sort( ( a, b ) => a - b ).map( time => new Date( time ) );
};

const makeSeries = (): SeriesData[] =>
	Array.from( { length: 1 + Math.floor( random() * 3 ) }, ( _, index ) => ( {
		label: `series ${ index }`,
		data: makeDates().map( ( date, position ) => ( { date, value: position } ) ),
	} ) );

describe( 'time axis tick invariants', () => {
	it( 'holds across data shapes, zones, resolutions and widths', () => {
		const failures: string[] = [];

		for ( let run = 0; run < 2000; run++ ) {
			const data = makeSeries();
			const timeZone = oneOf( ZONES );
			const resolution = oneOf( RESOLUTIONS );
			const maxTicks = getMaxTicksForWidth( oneOf( [ 60, 120, 320, 700, 900, 1400 ] ) );
			const formatter = getFormatter( data, resolution, { timeZone } );

			const points = [
				...new Set(
					data.flatMap( series =>
						series.data.map( point => ( point as { date: Date } ).date.getTime() )
					)
				),
			].sort( ( a, b ) => a - b );

			// Half the runs read a domain rather than the whole extent, and some of
			// those reach well past the data, which is what a brush dragged over a
			// sparse stretch hands the axis.
			let domain: [ Date, Date ] | undefined;
			if ( random() < 0.5 && points.length > 1 ) {
				const one = points[ Math.floor( random() * points.length ) ];
				const other = points[ Math.floor( random() * points.length ) ];
				const padding = random() < 0.5 ? Math.floor( random() * 2000 ) * HOUR : 0;
				domain = [
					new Date( Math.min( one, other ) - padding ),
					new Date( Math.max( one, other ) + padding ),
				];
			}

			const ticks = getTimeAxisTickValues( data, domain, formatter, maxTicks );
			if ( ! ticks ) {
				continue;
			}

			const visible = domain
				? points.filter( time => time >= domain[ 0 ].getTime() && time <= domain[ 1 ].getTime() )
				: points;
			if ( ! visible.length ) {
				continue;
			}

			const times = ticks.map( tick => tick.getTime() );
			const labels = ticks.map( tick => formatter( tick.getTime() ) );
			// Ticks answer to the scale, which spans the domain when there is one.
			const first = domain ? domain[ 0 ].getTime() : visible[ 0 ];
			const last = domain ? domain[ 1 ].getTime() : visible[ visible.length - 1 ];
			const note = ( why: string ) =>
				failures.push(
					`run ${ run }: ${ why } (points ${ visible.length }, maxTicks ${ maxTicks }, ${ timeZone }, resolution ${ resolution })`
				);

			if ( times.some( ( time, index ) => index > 0 && time <= times[ index - 1 ] ) ) {
				note( 'ticks are not strictly ascending' );
			}
			if ( times.length > maxTicks ) {
				note( `${ times.length } ticks over a budget of ${ maxTicks }` );
			}
			if ( times.some( time => time < first || time > last ) ) {
				note( 'a tick falls outside the domain' );
			}
			if ( labels.some( ( label, index ) => index > 0 && label === labels[ index - 1 ] ) ) {
				note( 'two adjacent ticks carry the same label' );
			}

			// One label is `span / maxTicks` wide, so a closer pair overlaps.
			const span = last - first;
			if ( span > 0 && times.length > 1 ) {
				const closest = Math.min(
					...times.slice( 1 ).map( ( time, index ) => time - times[ index ] )
				);
				const room = span / maxTicks;
				if ( closest < room * 0.9 ) {
					note( `two ticks share ${ Math.round( ( closest / room ) * 100 ) }% of a label's width` );
				}
			}
		}

		expect( failures.slice( 0, 10 ) ).toEqual( [] );
	} );
} );
