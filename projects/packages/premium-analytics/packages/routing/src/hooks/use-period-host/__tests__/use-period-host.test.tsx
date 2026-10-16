/**
 * The router boundary: `useSearch` reads the in-memory search state and
 * `useNavigate` applies the committed patch to it.
 */
const mockNavigate = jest.fn();
let mockSearch: Record< string, unknown > = {};

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
	useSearch: () => mockSearch,
} ) );

/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
import { PeriodChangeSignalProvider } from '@jetpack-premium-analytics/data';
import { act, renderHook } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { useReportDateFilters } from '../../use-report-date-filters';
import { usePeriodHost } from '../use-period-host';
import type { ReactNode } from 'react';

setSettings( {
	...getSettings(),
	timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
} );

const WEEK = {
	from: new TZDate( '2026-09-21T00:00:00.000+00:00', 'UTC' ),
	to: new TZDate( '2026-09-27T23:59:59.999+00:00', 'UTC' ),
};

const wrapper = ( { children }: { children: ReactNode } ) => (
	<PeriodChangeSignalProvider>{ children }</PeriodChangeSignalProvider>
);

// A stage: its date control reads the URL, and its widgets set the period through the host.
function renderStage() {
	return renderHook(
		() => {
			const dateFilters = useReportDateFilters( '/' );
			const host = usePeriodHost( 'traffic', dateFilters.appliedRange, true );

			return { dateFilters, host };
		},
		{ wrapper }
	);
}

describe( 'usePeriodHost', () => {
	beforeEach( () => {
		mockSearch = {
			from: '2026-01-01T00:00:00.000+00:00',
			to: '2026-10-05T23:59:59.999+00:00',
			preset: 'year-to-date',
			interval: 'week',
		};
		mockNavigate.mockReset();
		mockNavigate.mockImplementation(
			( {
				search,
			}: {
				search: ( prev: Record< string, unknown > ) => Record< string, unknown >;
			} ) => {
				mockSearch = search( mockSearch );
			}
		);
	} );

	it( 'draws the date control to a period a widget set, once it lands', () => {
		const { result, rerender } = renderStage();

		act( () => result.current.host.openPeriod( WEEK ) );
		rerender();

		expect( mockSearch ).toMatchObject( {
			from: '2026-09-21T00:00:00.000+00:00',
			to: '2026-09-27T23:59:59.999+00:00',
			preset: 'custom',
			interval: 'day',
		} );
		expect( result.current.host.attentionId ).toEqual( expect.any( Number ) );
	} );

	it( 'leaves the calendar on the new period when the picker closes after it', () => {
		const { result, rerender } = renderStage();
		const cancelBefore = result.current.dateFilters.onCancel;

		act( () => result.current.host.openPeriod( WEEK ) );
		rerender();
		act( () => cancelBefore() );

		expect( result.current.dateFilters.range ).toEqual( WEEK );
		expect( result.current.dateFilters.presetId ).toBe( 'custom' );
	} );
} );
