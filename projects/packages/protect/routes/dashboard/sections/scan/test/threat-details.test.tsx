import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { ignoreThreat } from '../threat-actions';
import ThreatDetails from '../threat-details';
import type { ScanThreat } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	useNavigate: () => jest.fn(),
} ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const threatIn = ( id: number, fixer: 'replace' | 'update' | 'delete' ): ScanThreat => ( {
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
		[ 'starts a replace fix at once', 1, 'replace', 1, [] ],
		[ 'asks for the slug before a delete fix', 2, 'delete', 0, [ 'Confirm deletion' ] ],
		[ 'asks before an update fix', 4, 'update', 0, [ 'Update' ] ],
	] as const )( '%s', async ( _name, id, fixer, calls, confirm ) => {
		render( <ThreatDetails threat={ threatIn( id, fixer ) } canAct /> );

		const autoFix = screen.getAllByRole( 'button', { name: 'Auto-fix it' } );
		expect( autoFix ).toHaveLength( 1 );
		await userEvent.click( autoFix[ 0 ] );

		expect( mockApiFetch ).toHaveBeenCalledTimes( calls );
		expect( confirm.filter( name => screen.queryByRole( 'button', { name } ) ) ).toEqual( confirm );
	} );

	it( 'disables Confirm deletion while another action runs on the threat', async () => {
		const threat = threatIn( 3, 'delete' );
		render( <ThreatDetails threat={ threat } canAct /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Auto-fix it' } ) );
		await userEvent.type( screen.getByRole( 'textbox' ), 'akismet' );
		const confirm = screen.getByRole( 'button', { name: 'Confirm deletion' } );
		expect( confirm ).toHaveAttribute( 'aria-disabled', 'false' );

		act( () => void ignoreThreat( threat ) );

		expect( confirm ).toHaveAttribute( 'aria-disabled', 'true' );
	} );
} );
