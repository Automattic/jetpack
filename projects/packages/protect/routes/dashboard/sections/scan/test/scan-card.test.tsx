import { ThreatSeverityBadge } from '@automattic/jetpack-scan';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import ScanCard from '../scan-card';
import { setScan } from '../store';
import { LEVELS, getLevel } from '../threats-list';
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

	it( 'keeps the title and Scan history while a scan runs', async () => {
		renderCard( { hasPlan: true, scanning: true } );

		expect( screen.getByRole( 'heading', { name: 'Scanning…' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'heading', { level: 2, name: 'Scan' } ) ).toBeInTheDocument();
		await expect( screen.findByText( 'View scan history' ) ).resolves.toBeInTheDocument();
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

describe( 'ScanCard threat list', () => {
	const fixable = {
		id: 5,
		title: 'Malicious code found in file: index.php',
		severity: 5,
		status: 'current' as const,
		fixable: { fixer: 'delete' },
		firstDetected: checkedAgo( HOUR_IN_MS ),
	};

	it.each( [
		[ true, 'offers', 1 ],
		[ false, 'hides', 0 ],
	] )(
		'with hasPlan %s, %s row selection, since only Scan can act on several threats',
		async ( hasPlan, _verb, count ) => {
			renderCard( { hasPlan, threats: [ fixable ] } );

			const table = await screen.findByRole( 'table' );
			expect( within( table ).queryAllByRole( 'checkbox', { name: 'Select all' } ) ).toHaveLength(
				count
			);
		}
	);

	it( 'shows each threat on one line, with its severity', () => {
		renderCard( { threats: [ fixable ] } );

		expect(
			screen.getByRole( 'button', { name: /^Malicious code found in file: index\.php/ } )
		).toBeInTheDocument();
		expect( screen.getByText( 'Critical' ) ).toBeInTheDocument();
	} );

	it( 'drops threats that leave the list from the selection', async () => {
		const user = userEvent.setup();
		const other = { ...fixable, id: 6, title: 'Malicious code found in file: other.php' };
		renderCard( { hasPlan: true, threats: [ fixable, other ] } );
		await user.click( await screen.findByRole( 'checkbox', { name: 'Select all' } ) );

		await act( async () => setScan( current => ( { ...current, threats: [ other ] } ) ) );
		expect( screen.getByText( '1 Item selected' ) ).toBeInTheDocument();

		await act( async () => setScan( current => ( { ...current, threats: [ fixable ] } ) ) );
		expect( screen.queryByText( /selected/ ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the other checked rows when one row is ignored from its menu', async () => {
		const user = userEvent.setup();
		const other = { ...fixable, id: 6, title: 'Malicious code found in file: other.php' };
		renderCard( { hasPlan: true, threats: [ fixable, other ] } );
		await user.click( await screen.findByRole( 'checkbox', { name: 'Select all' } ) );
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );

		const [ menu ] = screen.getAllByRole( 'button', { name: 'Actions' } );
		await user.click( menu );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Ignore' } ) );

		expect( screen.getByText( '1 Item selected' ) ).toBeInTheDocument();
	} );

	it( 'collapses the list from its heading', async () => {
		const user = userEvent.setup();
		renderCard( { threats: [ fixable ] } );
		const toggle = screen.getByRole( 'button', { name: 'Review and fix threats' } );

		await user.click( toggle );

		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( screen.queryByRole( 'table' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Severity filter', () => {
	it.each( [ undefined, 0, 2, 3, 4, 5, 9 ] )(
		'puts severity %p in the same level as its badge',
		severity => {
			render( <ThreatSeverityBadge severity={ severity } /> );
			const level = LEVELS.find( item => item.value === getLevel( { id: 1, severity } ) );

			expect( screen.getByText( level?.label ?? '' ) ).toBeInTheDocument();
		}
	);
} );
