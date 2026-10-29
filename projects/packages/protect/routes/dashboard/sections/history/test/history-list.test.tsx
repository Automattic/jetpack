import { act, render, screen, within } from '@testing-library/react';
import { resetScan } from '../../scan/store';
import HistoryList from '../history-list';
import type { ScanState, ScanThreat } from '../../scan/types';

let mockSearch: Record< string, string > = {};
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => mockSearch,
	useNavigate: () => jest.fn(),
} ) );

const threat = ( id: number, status: ScanThreat[ 'status' ] ) =>
	( {
		id,
		title: `Malicious code found in file: ${ id }.php`,
		filename: `/${ id }.php`,
		severity: 5,
		status,
		fixable: false,
		firstDetected: '2026-10-01T00:00:00.000Z',
		fixedOn: '2026-10-02T00:00:00.000Z',
	} ) as ScanThreat;

beforeEach( () => {
	window.jetpackProtectDashboard = { scan: { ignored: [ threat( 2, 'ignored' ) ] } as ScanState };
} );

afterEach( () => {
	delete window.jetpackProtectDashboard;
	resetScan();
} );

it.each( [
	[ 'fixed', 'Fixed (1)', '1.php' ],
	[ 'ignored', 'Ignored (1)', '2.php' ],
] )( 'renders the %s list in its own tab’s panel', async ( status, tab, file ) => {
	mockSearch = { status };
	render( <HistoryList threats={ [ threat( 1, 'fixed' ) ] } /> );
	// Let @wordpress/ui's deferred Tab/Panel check run.
	await act( () => new Promise( resolve => setTimeout( resolve, 0 ) ) );

	const panel = screen.getByRole( 'tabpanel', { name: tab } );
	expect( screen.getAllByRole( 'tabpanel' ) ).toEqual( [ panel ] );
	expect( within( panel ).getByText( file ) ).toBeInTheDocument();
	expect( panel ).toHaveAttribute( 'tabindex', '-1' );
} );

it( 'keeps an empty list’s panel as a tab stop', async () => {
	mockSearch = { status: 'fixed' };
	render( <HistoryList threats={ [] } /> );
	await act( () => new Promise( resolve => setTimeout( resolve, 0 ) ) );

	expect( screen.getByRole( 'tabpanel', { name: 'Fixed (0)' } ) ).toHaveAttribute(
		'tabindex',
		'0'
	);
} );
