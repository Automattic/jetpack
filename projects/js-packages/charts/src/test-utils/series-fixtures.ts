import type { SeriesData } from '../types';

const series = ( start: string, count: number, stepInHours: number ): SeriesData[] => [
	{
		label: 'views',
		data: Array.from( { length: count }, ( _, index ) => ( {
			date: new Date( new Date( start ).getTime() + index * stepInHours * 60 * 60 * 1000 ),
			value: index,
		} ) ),
	},
];

/**
 * One series of hourly points starting at `start`, `count` long.
 *
 * @param start - ISO instant of the first point.
 * @param count - Number of points.
 * @return A single-series fixture.
 */
export const hourlySeries = ( start: string, count: number ): SeriesData[] =>
	series( start, count, 1 );

/**
 * One series of daily points starting at `start`, `count` long.
 *
 * @param start - ISO instant of the first point.
 * @param count - Number of points.
 * @return A single-series fixture.
 */
export const dailySeries = ( start: string, count: number ): SeriesData[] =>
	series( start, count, 24 );
