/**
 * @jest-environment <rootDir>/tests/environment-los-angeles.mjs
 */
import { renderHook } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../../providers';
import { useBarChartOptions } from '../use-bar-chart-options';
import type { SeriesData } from '../../../../types';
import type { ReactNode } from 'react';

// The runtime locale stays en-US: a bucket labeled in German, on Tokyo's
// calendar day, can only come from the provider.

// 15:30 UTC is Aug 2 in Los Angeles and Aug 3 in Tokyo.
const START = new Date( '2026-08-02T15:30:00Z' );

const daily: SeriesData[] = [
	{
		label: 'Series A',
		data: Array.from( { length: 14 }, ( _, i ) => ( {
			date: new Date( START.getTime() + i * 24 * 60 * 60 * 1000 ),
			value: 10 + i,
		} ) ),
		options: {},
	},
];

const withProvider =
	( props: { locale?: string; timeZone?: string } = {} ) =>
	( { children }: { children: ReactNode } ) => (
		<GlobalChartsProvider { ...props }>{ children }</GlobalChartsProvider>
	);

const optionsFor = (
	props?: { locale?: string; timeZone?: string },
	options?: Parameters< typeof useBarChartOptions >[ 2 ]
) =>
	renderHook( () => useBarChartOptions( daily, false, options ), {
		wrapper: withProvider( props ),
	} ).result.current;

describe( 'useBarChartOptions with a host formatting context', () => {
	it( 'labels the tooltip bucket in the provider locale and time zone', () => {
		const { tooltip } = optionsFor( { locale: 'de-DE', timeZone: 'Asia/Tokyo' } );

		expect( tooltip.labelFormatter( START.getTime(), 0, [] ) ).toBe( '3. August 2026' );
	} );

	it( 'labels a weekly bucket in the provider locale and time zone', () => {
		const { tooltip } = optionsFor(
			{ locale: 'de-DE', timeZone: 'Asia/Tokyo' },
			{ axis: { x: { tickResolution: 'week' } } }
		);

		expect( tooltip.labelFormatter( START.getTime(), 0, [] ) ).toBe( 'Week of 3. August 2026' );
	} );

	it( 'labels the axis ticks in the provider locale and time zone', () => {
		const { axis } = optionsFor( { locale: 'de-DE', timeZone: 'Asia/Tokyo' } );

		expect( axis.x.tickFormat( START, 0, [] ) ).toBe( '3. Aug.' );
	} );

	it( 'falls back to the runtime locale and zone when the provider supplies none', () => {
		const { tooltip, axis } = optionsFor();

		expect( tooltip.labelFormatter( START.getTime(), 0, [] ) ).toBe( 'August 2, 2026' );
		expect( axis.x.tickFormat( START, 0, [] ) ).toBe( 'Aug 2' );
	} );
} );
