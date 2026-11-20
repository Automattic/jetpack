import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { recordEvent } from '../data/tracks';
import HistoryList from '../sections/history/history-list';
import ThreatsList from '../sections/scan/threats-list';
import type { ScanThreat } from '../sections/scan/types';
import type { ReactElement } from 'react';

jest.mock( '../data/tracks', () => ( { recordEvent: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const mockRecordEvent = recordEvent as jest.Mock;

const threats = ( count: number, status: ScanThreat[ 'status' ] ): ScanThreat[] =>
	Array.from(
		{ length: count },
		( _, i ) =>
			( {
				id: i + 1,
				title: `Malicious code found in file: ${ i + 1 }.php`,
				filename: `/${ i + 1 }.php`,
				severity: 5,
				status,
				fixable: false,
				firstDetected: '2026-10-01T00:00:00.000Z',
				fixedOn: '2026-10-02T00:00:00.000Z',
			} ) as ScanThreat
	);

beforeEach( () => mockRecordEvent.mockClear() );

// Page 2, then one page fewer, as fixing or ignoring the last threat there does.
it.each( [
	[ 'Scan', ( count: number ) => <ThreatsList threats={ threats( count, 'current' ) } canAct /> ],
	[ 'History', ( count: number ) => <HistoryList threats={ threats( count, 'fixed' ) } /> ],
] )(
	'%s records a page change, but not the move back DataViews makes when the list shrinks',
	async ( _name, table: ( count: number ) => ReactElement ) => {
		const { rerender } = render( table( 21 ) );
		await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );

		expect( mockRecordEvent.mock.calls ).toEqual( [
			[ 'jetpack_scan_page_change', { page: 2 } ],
			[ 'jetpack_scan_view_change' ],
		] );

		mockRecordEvent.mockClear();
		rerender( table( 20 ) );

		await expect( screen.findByText( '1.php' ) ).resolves.toBeInTheDocument();
		expect( mockRecordEvent ).not.toHaveBeenCalled();
	}
);
