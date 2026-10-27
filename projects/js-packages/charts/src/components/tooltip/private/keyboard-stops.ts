import type { DataPointDate, SeriesData } from '../../../types';

/** A series' point at a keyboard stop. */
export type StopMember = { series: SeriesData; datum: DataPointDate; index: number };

export type KeyboardStops = {
	count: number;
	membersAt: ( stop: number ) => StopMember[];
};

const timeOf = ( point: unknown ): number | undefined =>
	( point as DataPointDate | undefined )?.date?.getTime();

const getXPositions = ( series: SeriesData[] ): number[] => {
	const positions = new Set< number >();

	for ( const { data } of series ) {
		for ( const point of data ) {
			const time = timeOf( point );
			if ( time !== undefined ) {
				positions.add( time );
			}
		}
	}

	return [ ...positions ].sort( ( a, b ) => a - b );
};

/**
 * Keyboard stops over the series: the sorted union of their dates, or array indexes when no point has a date.
 *
 * Once any point has a date, a series of undated points has no stop.
 *
 * @param series - The series to step through.
 * @return The stop count, and each series' point at a stop.
 */
export const getKeyboardStops = ( series: SeriesData[] ): KeyboardStops => {
	const positions = getXPositions( series );

	if ( positions.length === 0 ) {
		return {
			count: Math.max( 0, ...series.map( ( { data } ) => data.length ) ),
			membersAt: stop =>
				series.flatMap( s =>
					stop < s.data.length
						? [ { series: s, datum: s.data[ stop ] as DataPointDate, index: stop } ]
						: []
				),
		};
	}

	return {
		count: positions.length,
		membersAt: stop => {
			const time = positions[ stop ];
			if ( time === undefined ) {
				return [];
			}
			return series.flatMap( s => {
				const index = s.data.findIndex( point => timeOf( point ) === time );
				return index === -1
					? []
					: [ { series: s, datum: s.data[ index ] as DataPointDate, index } ];
			} );
		},
	};
};
