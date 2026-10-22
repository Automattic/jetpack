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
	it( 'says what the free check covered without claiming the site is safe or scanned', () => {
		renderCard( {} );

		expect( screen.getByText( 'No known vulnerabilities found' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Your site is safe right now' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /scanned automatically/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /No issues were found after scanning/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'View scan history' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Get the rest of your site’s protection' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute( 'href', '#' );
	} );

	it( 'shows the failure instead of an all clear when the report fails', () => {
		renderCard( { error: true } );

		expect(
			screen.getByText( 'We couldn’t check your site for vulnerabilities right now.' )
		).toBeInTheDocument();
		expect( screen.queryByText( 'No known vulnerabilities found' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'ScanCard with Scan', () => {
	it( 'shows the all clear and Scan history after a clean scan', async () => {
		renderCard( { hasPlan: true } );

		expect( screen.getByText( 'Your site is safe right now' ) ).toBeInTheDocument();
		await expect( screen.findByText( 'View scan history' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );
} );

describe( 'ScanCard empty state', () => {
	it.each( [
		[ false, 48, /Vulnerabilities are checked automatically every day\./, 'Check again now' ],
		[ false, 1, /Next check will happen automatically on /, 'Check again now' ],
		[ true, 48, /Your site is scanned automatically every day\./, 'Scan again now' ],
		[ true, 1, /Next scan will happen automatically on /, 'Scan again now' ],
	] )(
		'with hasPlan %s, checked %i hours ago, words the next check and button for that plan',
		async ( hasPlan, hoursAgo, next, button ) => {
			renderCard( { hasPlan, lastChecked: checkedAgo( hoursAgo * HOUR_IN_MS ) } );

			expect( screen.getByText( next ) ).toBeInTheDocument();
			await expect( screen.findByRole( 'button', { name: button } ) ).resolves.toBeInTheDocument();
		}
	);
} );
