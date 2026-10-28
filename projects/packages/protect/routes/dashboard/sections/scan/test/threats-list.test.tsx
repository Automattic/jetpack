import { act, render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { fixThreat, ignoreThreat } from '../threat-actions';
import ThreatsList from '../threats-list';
import type { ScanThreat } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'ThreatsList', () => {
	it.each( [
		[ 'Fixing…', 1, fixThreat ],
		[ 'Ignoring…', 2, ignoreThreat ],
	] )( 'shows %s in place of the date while the action runs', ( status, id, start ) => {
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );
		const threat: ScanThreat = {
			id,
			title: 'Malicious code found in file: a.php',
			fixable: { fixer: 'replace' },
			firstDetected: '2026-08-15T07:00:00Z',
		};
		render( <ThreatsList threats={ [ threat ] } canAct /> );
		expect( screen.getByText( 'Aug 15, 7:00 AM' ) ).toBeInTheDocument();

		act( () => void start( threat ) );

		expect( screen.getByText( status ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Aug 15, 7:00 AM' ) ).not.toBeInTheDocument();
	} );
} );
