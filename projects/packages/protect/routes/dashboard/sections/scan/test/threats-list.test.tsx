import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { recordEvent } from '../../../data/tracks';
import ThreatsList from '../threats-list';
import type { ScanThreat } from '../types';

jest.mock( '../../../data/tracks', () => ( { recordEvent: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const mockRecordEvent = recordEvent as jest.Mock;

const threats = ( count: number ): ScanThreat[] =>
	Array.from(
		{ length: count },
		( _, i ) =>
			( {
				id: i + 1,
				title: `Malicious code found in file: ${ i + 1 }.php`,
				filename: `/${ i + 1 }.php`,
				severity: 5,
				status: 'current',
				fixable: false,
				firstDetected: '2026-10-01T00:00:00.000Z',
			} ) as ScanThreat
	);

it( 'records a page change, but not the move back DataViews makes when the list shrinks', async () => {
	const { rerender } = render( <ThreatsList threats={ threats( 21 ) } canAct /> );
	await userEvent.click( screen.getByRole( 'button', { name: 'Next page' } ) );

	expect( mockRecordEvent.mock.calls ).toEqual( [
		[ 'jetpack_scan_page_change', { page: 2 } ],
		[ 'jetpack_scan_view_change' ],
	] );

	mockRecordEvent.mockClear();
	rerender( <ThreatsList threats={ threats( 20 ) } canAct /> );

	await expect( screen.findByText( '1.php' ) ).resolves.toBeInTheDocument();
	expect( mockRecordEvent ).not.toHaveBeenCalled();
} );
