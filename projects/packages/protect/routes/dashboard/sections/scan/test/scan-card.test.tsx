import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import historySection from '../../history';
import ScanCard from '../scan-card';
import { setScan } from '../store';
import type { ScanState } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const report: ScanState = {
	hasPlan: false,
	url: '#',
	error: false,
	scanning: false,
	lastChecked: '2026-10-01 10:00:00',
	pluginsChecked: 3,
	themesChecked: 1,
	threats: [],
};

window.jetpackProtectDashboard = { scan: report };

const renderCard = ( scan: Partial< ScanState > ) => {
	setScan( () => ( { ...report, ...scan } ) );
	return render( <ScanCard openTab={ jest.fn() } /> );
};

describe( 'ScanCard without Scan', () => {
	beforeEach( () => {
		mockApiFetch.mockReset().mockResolvedValue( [] );
	} );

	it.each( [
		[ 'a clean free report', {} ],
		[ 'a failed report', { error: true } ],
	] )( 'never claims the site is safe or scanned on %s', ( _name, scan ) => {
		renderCard( scan );

		expect( screen.queryByText( 'Your site is safe right now' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /scanned automatically/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /No issues were found after scanning/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'View scan history' ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'link', { name: /Get Scan for daily malware scanning/ } )
		).toBeInTheDocument();
	} );

	it( 'says what the free check covered', () => {
		renderCard( {} );

		expect( screen.getByText( 'No known vulnerabilities found' ) ).toBeInTheDocument();
		expect( screen.getByText( /Your files aren’t checked for malware/ ) ).toBeInTheDocument();
	} );

	it( 'shows the failure instead of an all clear when the report fails', () => {
		renderCard( { error: true } );

		expect(
			screen.getByText( 'We couldn’t check your site for vulnerabilities right now.' )
		).toBeInTheDocument();
		expect( screen.queryByText( 'No known vulnerabilities found' ) ).not.toBeInTheDocument();
	} );

	it( 'hides the History tab', () => {
		const isAvailable = historySection.tab?.isAvailable;

		expect( isAvailable?.( { state: { hasPlan: false } } as never ) ).toBe( false );
		expect( isAvailable?.( { state: { hasPlan: true } } as never ) ).toBe( true );
	} );
} );

describe( 'ScanCard with Scan', () => {
	beforeEach( () => {
		mockApiFetch.mockReset().mockResolvedValue( [] );
	} );

	it( 'shows the all clear and Scan history after a clean scan', async () => {
		renderCard( { hasPlan: true } );

		expect( screen.getByText( 'Your site is safe right now' ) ).toBeInTheDocument();
		await expect( screen.findByText( 'View scan history' ) ).resolves.toBeInTheDocument();
	} );
} );
