import { render } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers';
import { useMonthCalendarHeatmapData } from '../use-month-calendar-heatmap-data';
import type { MonthCalendarHeatmapOptions, MonthCalendarHeatmapResult } from '../types';

const range = { start: '2026-08-01', end: '2026-09-14' };
const valueByDay = { '2026-08-03': 4 };

// Read from Intl rather than spelled out: short month names drift between ICU builds.
const monthLabels = ( locale: string ) => {
	const format = new Intl.DateTimeFormat( locale, {
		month: 'short',
		calendar: 'gregory',
		timeZone: 'UTC',
	} );
	return [
		format.format( new Date( '2026-08-01T00:00:00Z' ) ),
		format.format( new Date( '2026-09-01T00:00:00Z' ) ),
	];
};

describe( 'useMonthCalendarHeatmapData', () => {
	let result: MonthCalendarHeatmapResult;
	let renders = 0;

	const Calendar = ( { options }: { options?: MonthCalendarHeatmapOptions } ) => {
		result = useMonthCalendarHeatmapData( valueByDay, range, options );
		renders++;
		return null;
	};

	beforeEach( () => {
		renders = 0;
	} );

	it( "takes the provider's locale", () => {
		render(
			<GlobalChartsProvider locale="de-DE">
				<Calendar />
			</GlobalChartsProvider>
		);
		expect( result.columnGroups.map( group => group.label ) ).toEqual( monthLabels( 'de-DE' ) );
	} );

	it( 'lets an explicit locale win over the provider', () => {
		render(
			<GlobalChartsProvider locale="de-DE">
				<Calendar options={ { locale: 'fr-FR' } } />
			</GlobalChartsProvider>
		);
		expect( result.columnGroups.map( group => group.label ) ).toEqual( monthLabels( 'fr-FR' ) );
	} );

	it( 'keeps the same result across a rebuilt options object', () => {
		const { rerender } = render(
			<GlobalChartsProvider>
				<Calendar options={ { weekStartsOn: 1 } } />
			</GlobalChartsProvider>
		);
		const first = result;
		rerender(
			<GlobalChartsProvider>
				<Calendar options={ { weekStartsOn: 1 } } />
			</GlobalChartsProvider>
		);
		expect( renders ).toBeGreaterThan( 1 );
		expect( result ).toBe( first );
	} );
} );
