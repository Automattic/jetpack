import type { DataPointDate, SeriesData } from '../../../types';

const timeOf = ( point: unknown ): number | undefined =>
	( point as DataPointDate | undefined )?.date?.getTime();

export const getXPositions = ( series: SeriesData[] ): number[] => {
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

export const datumAtX = (
	series: SeriesData,
	x: number
): { datum: DataPointDate; index: number } | undefined => {
	const index = series.data.findIndex( point => timeOf( point ) === x );

	return index === -1 ? undefined : { datum: series.data[ index ] as DataPointDate, index };
};
