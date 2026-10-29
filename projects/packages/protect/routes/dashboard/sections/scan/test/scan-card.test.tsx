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
	const twoHoursAgo = checkedAgo( 2 * HOUR_IN_MS );

	it.each( [
		[
			twoHoursAgo,
			'Last scan 2 hours ago',
			`${ twoHoursAgo.replace( ' ', 'T' ) }.000Z`,
			expect.stringMatching( /^\w{3} \d{1,2}, \d{4} \d{1,2}:\d{2} [AP]M$/ ),
		],
		[ null, null, null, null ],
	] )( 'shows when the site was last scanned, from %s', ( lastChecked, text, dateTime, title ) => {
		renderCard( { lastChecked } );

		const badge = screen.queryByText( /^Last scan / );
		expect( badge?.textContent ?? null ).toBe( text );
		expect( badge?.getAttribute( 'datetime' ) ?? null ).toBe( dateTime );
		expect( badge?.getAttribute( 'title' ) ?? null ).toEqual( title );
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
		expect( screen.getByRole( 'heading', { level: 2, name: 'Scan results' } ) ).toBeInTheDocument();
		await expect( screen.findByText( 'View scan history' ) ).resolves.toBeInTheDocument();
	} );
} );

describe( 'ScanCard empty state', () => {
	it.each( [
		[
			false,
			'No vulnerabilities found',
			'No issues were found after checking 3 plugins and 1 theme for known vulnerabilities.',
		],
		[ true, 'No threats found', 'No issues were found after scanning 3 plugins and 1 theme.' ],
	] )(
		'with hasPlan %s, says %s and what was checked, leaving scans to the page header',
		async ( hasPlan, title, details ) => {
			renderCard( { hasPlan } );

			await expect(
				screen.findByRole( 'heading', { level: 3, name: title } )
			).resolves.toBeInTheDocument();
			expect( screen.getByText( details ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		}
	);

	it.each( [
		[ false, 48, /Vulnerabilities are checked automatically every day\./ ],
		[ false, 1, 'Next check in:' ],
		[ true, 48, /Your site is scanned automatically every day\./ ],
		[ true, 1, /Your site is scanned automatically every day\./ ],
	] )(
		'with hasPlan %s, checked %i hours ago, words the next check for that plan',
		async ( hasPlan, hoursAgo, next ) => {
			renderCard( { hasPlan, lastChecked: checkedAgo( hoursAgo * HOUR_IN_MS ) } );

			await expect( screen.findByText( next ) ).resolves.toBeInTheDocument();
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
