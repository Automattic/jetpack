import { act, render, screen, within } from '@testing-library/react';
import HistoryList from '../history-list';
import type { ScanThreat } from '../../scan/types';

jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const fixed = {
	id: 1,
	title: 'Malicious code found in file: 1.php',
	filename: '/1.php',
	severity: 5,
	status: 'fixed',
	fixable: false,
	firstDetected: '2026-10-01T00:00:00.000Z',
	fixedOn: '2026-10-02T00:00:00.000Z',
} as ScanThreat;

it( 'renders the list in the selected tab’s panel', async () => {
	render( <HistoryList threats={ [ fixed ] } /> );
	// Let @wordpress/ui's deferred Tab/Panel check run.
	await act( () => new Promise( resolve => setTimeout( resolve, 0 ) ) );

	const panel = screen.getByRole( 'tabpanel', { name: 'Fixed (1)' } );
	expect( within( panel ).getByText( '1.php' ) ).toBeInTheDocument();
} );
