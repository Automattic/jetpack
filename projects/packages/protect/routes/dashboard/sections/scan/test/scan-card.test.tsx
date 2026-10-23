import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import ScanCard from '../scan-card';
import { setScan } from '../store';
import type { ScanState } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const HOUR_IN_MS = 60 * 60 * 1000;

// Reports use UTC `YYYY-MM-DD HH:MM:SS`.
const checkedAgo = ( ms: number ) =>
	new Date( Date.now() - ms ).toISOString().slice( 0, 19 ).replace( 'T', ' ' );

const report: ScanState = {
	hasPlan: false,
	url: '#',
	error: false,
	scanning: false,
	lastChecked: checkedAgo( 48 * HOUR_IN_MS ),
	pluginsChecked: 3,
	themesChecked: 1,
	threats: [],
};

window.jetpackProtectDashboard = { scan: report };

const renderCard = ( scan: Partial< ScanState > ) => {
	setScan( () => ( { ...report, ...scan } ) );
	return render( <ScanCard openTab={ jest.fn() } /> );
};

beforeEach( () => {
	mockApiFetch.mockReset().mockResolvedValue( [] );
} );

describe( 'ScanCard without Scan', () => {
	it.each( [
		[ checkedAgo( 2 * HOUR_IN_MS ), 'Last scanned 2 hours ago' ],
		[ null, null ],
	] )( 'shows when the site was last scanned, from %s', ( lastChecked, text ) => {
		renderCard( { lastChecked } );

		expect( screen.queryByText( /^Last scanned/ )?.textContent ?? null ).toBe( text );
	} );

	it( 'says what the free check covered without claiming the site is safe or scanned', () => {
		renderCard( {} );

		expect( screen.getByText( 'No vulnerabilities found' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'No threats found' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /after scanning/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'View scan history' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Get the rest of your site’s protection' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute( 'href', '#' );
	} );

	it( 'shows the failure instead of an all clear when the report fails', () => {
		renderCard( { error: true } );

		expect(
			screen.getByText( 'We couldn’t check your site for vulnerabilities right now.' )
		).toBeInTheDocument();
		expect( screen.queryByText( 'No vulnerabilities found' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'ScanCard with Scan', () => {
	it( 'shows the all clear and Scan history after a clean scan', async () => {
		renderCard( { hasPlan: true } );

		expect( screen.getByText( 'No threats found' ) ).toBeInTheDocument();
		await expect( screen.findByText( 'View scan history' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the title and Scan history while a scan runs', async () => {
		renderCard( { hasPlan: true, scanning: true } );

		expect( screen.getByRole( 'heading', { name: 'Scanning…' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'heading', { level: 2, name: 'Scan' } ) ).toBeInTheDocument();
		await expect( screen.findByText( 'View scan history' ) ).resolves.toBeInTheDocument();
	} );
} );

describe( 'ScanCard empty state', () => {
	it.each( [
		[
			false,
			'No issues were found after checking 3 plugins and 1 theme for known vulnerabilities.',
		],
		[ true, 'No issues were found after scanning 3 plugins and 1 theme in the latest scan.' ],
	] )(
		'with hasPlan %s, says what was checked and leaves starting a scan to the page header',
		async ( hasPlan, details ) => {
			renderCard( { hasPlan } );

			expect( screen.getByText( details ) ).toBeInTheDocument();
			await expect( screen.findByRole( 'heading', { level: 3 } ) ).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		}
	);
} );
