import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { recordEvent } from '../../../data/tracks';
import HeaderScanButton from '../header-scan-button';
import ScanCard from '../scan-card';
import ScanStartNotice from '../scan-start-notice';
import { resetScan, setScan } from '../store';
import type { ScanState } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../../../data/tracks' );
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
 * Render a clean report and answer the scan request.
 *
 * @param answer - Resolves or rejects the POST.
 * @param ui     - What to render, with the header's Scan site button.
 * @return Resolves once the button is clicked.
 */
function renderAndScan(
	answer: () => Promise< unknown >,
	ui = (
		<>
			<HeaderScanButton />
			<ScanCard openTab={ jest.fn() } />
		</>
	)
) {
	mockApiFetch
		.mockReset()
		.mockImplementation( ( { method } ) =>
			method === 'POST' ? answer() : Promise.resolve( [] )
		);
	setScan( () => report );
	render( ui );
	return userEvent.click( screen.getByRole( 'button', { name: 'Scan site' } ) );
}

describe( 'Scan now', () => {
	beforeEach( resetScan );

	it( 'follows the report the scan request returns', async () => {
		// Stamped as the POST is answered, so it is newer than the click however slow the render,
		// and only reading the response ends the optimistic "Scanning…".
		await renderAndScan( () =>
			Promise.resolve( {
				...report,
				lastChecked: new Date( Date.now() + 1000 ).toISOString().slice( 0, 19 ).replace( 'T', ' ' ),
			} )
		);

		await expect( screen.findByText( 'No threats found' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Scanning…' ) ).not.toBeInTheDocument();
	} );

	it( 'records jetpack_scan_scan_now from the page header', async () => {
		( recordEvent as jest.Mock ).mockClear();
		await renderAndScan( () => new Promise( () => {} ) );

		expect( ( recordEvent as jest.Mock ).mock.calls ).toEqual( [
			[ 'jetpack_scan_scan_now', { has_plan: true } ],
		] );
	} );

	it( 'shows why the scan didn’t start until dismissed, and stops showing it as running', async () => {
		const message = 'The scan couldn’t be started: Unable to find a valid site.';
		await renderAndScan(
			() => Promise.reject( { code: 'scan_not_started', message } ),
			<>
				<ScanStartNotice />
				<HeaderScanButton />
				<ScanCard openTab={ jest.fn() } />
			</>
		);

		await expect( screen.findByText( message ) ).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Scanning…' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Scan site' } ) ).toBeEnabled();

		await userEvent.click( screen.getByRole( 'button', { name: /dismiss|close/i } ) );

		expect( screen.queryByText( message ) ).not.toBeInTheDocument();
	} );

	it( 'shows the scan as running in the card when started from the page header', async () => {
		await renderAndScan( () => new Promise( () => {} ) );

		expect( screen.getByRole( 'heading', { name: 'Scanning…' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Scanning…' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'replays the shield burst once a free check comes back', async () => {
		const free = { ...report, hasPlan: false };
		mockApiFetch.mockReset().mockResolvedValue( free );
		setScan( () => free );
		const { container } = render(
			<>
				<HeaderScanButton />
				<ScanCard openTab={ jest.fn() } />
			</>
		);
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the burst is decorative and aria-hidden.
		expect( container.querySelector( '.is-bursting' ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByRole( 'button', { name: 'Scan site' } ) );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the burst is decorative and aria-hidden.
		await waitFor( () => expect( container.querySelector( '.is-bursting' ) ).toBeInTheDocument() );
	} );

	it.each( [
		[ false, 'true', 'Next free check in a day. Upgrade to Scan to check anytime.' ],
		[ true, 'false', '' ],
	] )(
		'with hasPlan %s, an hour after the last check, sets the header button aria-disabled to %s',
		( hasPlan, disabled, description ) => {
			const lastChecked = new Date( Date.now() - 60 * 60 * 1000 )
				.toISOString()
				.slice( 0, 19 )
				.replace( 'T', ' ' );
			setScan( () => ( { ...report, hasPlan, lastChecked } ) );
			render( <HeaderScanButton /> );

			const button = screen.getByRole( 'button', { name: 'Scan site' } );
			expect( button ).toHaveAttribute( 'aria-disabled', disabled );
			expect( button ).toHaveAccessibleDescription( description );
		}
	);
} );
