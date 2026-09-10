/**
 * @jest-environment <rootDir>/tests/environment-los-angeles.mjs
 */

// Los Angeles runs behind UTC, the half `zoned-calendar-data` cannot cover: a label
// formatter that stops reading UTC renders the proxy on the previous day only here.
import { render } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import { useCalendarHeatmapData } from '../use-calendar-heatmap-data';
import type { DataPointDate } from '../../../types';
import type { CalendarHeatmapOptions, CalendarHeatmapResult } from '../private';

// 2026-08-03 08:00 in Asia/Tokyo, 2026-08-02 16:00 in America/Los_Angeles.
const series: DataPointDate[] = [ { date: new Date( '2026-08-02T23:00:00Z' ), value: 7 } ];

// Aug 3 in UTC, Aug 2 in this file's zone, so a bucket tells the two apart.
const runtimeVsUtc: DataPointDate[] = [ { date: new Date( '2026-08-03T05:00:00Z' ), value: 7 } ];

describe( 'useCalendarHeatmapData', () => {
	let result: CalendarHeatmapResult;
	let renders = 0;

	const Calendar = ( {
		options,
		points = series,
	}: {
		options?: CalendarHeatmapOptions;
		points?: DataPointDate[];
	} ) => {
		result = useCalendarHeatmapData( points, { weekStartsOn: 1, ...options } );
		renders++;
		return null;
	};

	beforeEach( () => {
		renders = 0;
	} );

	const bucketedLabels = () =>
		result.data
			.flatMap( column => column.data )
			.filter( cell => cell.value !== null )
			.map( cell => cell.label );

	it( "takes the provider's locale and time zone", () => {
		render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<Calendar />
			</GlobalChartsProvider>
		);

		expect( bucketedLabels() ).toEqual( [ 'Mo., 3. Aug. 2026' ] );
		expect( result.rowLabels ).toEqual( [ 'Mo', '', 'Mi', '', 'Fr', '', '' ] );
	} );

	it( 'lets an option win over the provider', () => {
		render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<Calendar options={ { timeZone: 'America/Los_Angeles' } } />
			</GlobalChartsProvider>
		);

		expect( bucketedLabels() ).toEqual( [ 'So., 2. Aug. 2026' ] );
	} );

	it( 'reads an explicit undefined as unset rather than as an override', () => {
		render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<Calendar options={ { locale: undefined, timeZone: undefined } } />
			</GlobalChartsProvider>
		);

		expect( bucketedLabels() ).toEqual( [ 'Mo., 3. Aug. 2026' ] );
	} );

	it( 'falls back to the runtime with no provider around it', () => {
		render( <Calendar points={ runtimeVsUtc } /> );

		expect( result.rowLabels ).toEqual( [ 'Mon', '', 'Wed', '', 'Fri', '', '' ] );
		// rowLabels only prove the locale fell back; the bucket proves the zone did.
		expect( bucketedLabels() ).toEqual( [ 'Sun, Aug 2, 2026' ] );
	} );

	it( 'holds its result across a re-render that rebuilds the options object', () => {
		const { rerender } = render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<Calendar options={ { gridSpan: { start: '2026-07-06' } } } />
			</GlobalChartsProvider>
		);
		const first = result;

		rerender(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<Calendar options={ { gridSpan: { start: '2026-07-06' } } } />
			</GlobalChartsProvider>
		);

		expect( renders ).toBeGreaterThan( 1 );
		expect( result ).toBe( first );
	} );

	it( 'rebuilds when the provider changes zone', () => {
		const { rerender } = render(
			<GlobalChartsProvider locale="de-DE" timeZone="Asia/Tokyo">
				<Calendar />
			</GlobalChartsProvider>
		);
		expect( bucketedLabels() ).toEqual( [ 'Mo., 3. Aug. 2026' ] );

		rerender(
			<GlobalChartsProvider locale="de-DE" timeZone="America/Los_Angeles">
				<Calendar />
			</GlobalChartsProvider>
		);

		expect( bucketedLabels() ).toEqual( [ 'So., 2. Aug. 2026' ] );
	} );
} );
