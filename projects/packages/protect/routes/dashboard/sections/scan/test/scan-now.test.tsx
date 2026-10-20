import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { recordEvent } from '../../../data/analytics';
import ScanCard from '../scan-card';
import { setScan } from '../store';
import type { ScanState } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../../../data/analytics', () => ( { recordEvent: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const report: ScanState = {
	hasPlan: true,
	url: '#',
	error: false,
	scanning: false,
	lastChecked: '2026-10-01 10:00:00',
	pluginsChecked: 3,
	themesChecked: 1,
	threats: [],
};

window.jetpackProtectDashboard = { scan: report };

/**
 * Render the card with a clean report and answer the Scan now request.
 *
 * @param answer - Resolves or rejects the POST.
 * @return Resolves once the button is clicked.
 */
function renderAndScan( answer: () => Promise< unknown > ) {
	mockApiFetch
		.mockReset()
		.mockImplementation( ( { method } ) =>
			method === 'POST' ? answer() : Promise.resolve( [] )
		);
	setScan( () => report );
	render( <ScanCard openTab={ jest.fn() } /> );
	return userEvent.click( screen.getByRole( 'button', { name: 'Scan again now' } ) );
}

describe( 'Scan now', () => {
	it( 'follows the report the scan request returns', async () => {
		// Stamped as the POST is answered, so it is newer than the click however slow the render,
		// and only reading the response ends the optimistic "Scanning…".
		await renderAndScan( () =>
			Promise.resolve( {
				...report,
				lastChecked: new Date( Date.now() + 1000 ).toISOString().slice( 0, 19 ).replace( 'T', ' ' ),
			} )
		);

		await expect( screen.findByText( 'Your site is safe right now' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Scanning…' ) ).not.toBeInTheDocument();
	} );

	it( 'records jetpack_scan_scan_now', async () => {
		await renderAndScan( () => Promise.resolve( report ) );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_scan_scan_now', { has_plan: true } );
	} );

	it( 'shows why the scan didn’t start, and stops showing it as running', async () => {
		await renderAndScan( () =>
			Promise.reject( {
				code: 'scan_not_started',
				message: 'The scan couldn’t be started: Unable to find a valid site.',
			} )
		);

		await expect(
			screen.findByText( 'The scan couldn’t be started: Unable to find a valid site.' )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Scanning…' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Scan again now' } ) ).toBeEnabled();
	} );
} );
