import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import ThreatDetails from '../threat-details';
import type { ScanThreat } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const threatIn = ( id: number, fixer: 'update' | 'delete' ): ScanThreat => ( {
	id,
	signature: 'Vulnerable.WP.Extension',
	title: 'Vulnerable plugin',
	status: 'current',
	fixable: { fixer },
	extension: { type: 'plugins', slug: 'akismet', name: 'Akismet', version: '1.0' },
} );

window.jetpackProtectDashboard = {
	scan: { hasPlan: true, url: '#', error: false, threats: [], ignored: [] },
};

describe( 'ThreatDetails', () => {
	beforeEach( () => {
		mockApiFetch.mockReset().mockReturnValue( new Promise( () => {} ) );
	} );

	it.each( [
		[ 'starts an update fix at once', 1, 'update', false ],
		[ 'asks for the slug before a delete fix', 2, 'delete', true ],
	] as const )( '%s', async ( _name, id, fixer, confirms ) => {
		render( <ThreatDetails threat={ threatIn( id, fixer ) } canAct /> );

		const autoFix = screen.getAllByRole( 'button', { name: 'Auto-fix it' } );
		expect( autoFix ).toHaveLength( 1 );
		await userEvent.click( autoFix[ 0 ] );

		expect( mockApiFetch ).toHaveBeenCalledTimes( confirms ? 0 : 1 );
		expect( !! screen.queryByRole( 'button', { name: 'Confirm deletion' } ) ).toBe( confirms );
	} );

	it( 'starts a delete fix and closes the confirmation once the slug is typed', async () => {
		render( <ThreatDetails threat={ threatIn( 3, 'delete' ) } canAct /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Auto-fix it' } ) );
		await userEvent.type( screen.getByRole( 'textbox' ), 'akismet' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Confirm deletion' } ) );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( '/threats/3/fix' ) } )
		);
		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: 'Confirm deletion' } ) ).not.toBeInTheDocument()
		);
		expect( screen.getByRole( 'button', { name: 'Fixing…' } ) ).toBeInTheDocument();
	} );
} );
