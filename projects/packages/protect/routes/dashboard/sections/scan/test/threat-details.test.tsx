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
		const shown = [ 'Confirm deletion', 'Update' ].filter( name =>
			screen.queryByRole( 'button', { name } )
		);
		expect( shown ).toEqual( confirm );
	} );

	it.each( [
		[ 'Confirm deletion', 3, 'delete' ],
		[ 'Update', 5, 'update' ],
	] as const )(
		'disables %s while another action runs on the threat',
		async ( name, id, fixer ) => {
			const threat = threatIn( id, fixer );
			render( <ThreatDetails threat={ threat } canAct /> );
			await userEvent.click( screen.getByRole( 'button', { name: 'Auto-fix it' } ) );
			if ( fixer === 'delete' ) {
				await userEvent.type( screen.getByRole( 'textbox' ), 'akismet' );
			}
			const confirm = screen.getByRole( 'button', { name } );
			expect( confirm ).toHaveAttribute( 'aria-disabled', 'false' );

			act( () => void ignoreThreat( threat ) );

			expect( confirm ).toHaveAttribute( 'aria-disabled', 'true' );
		}
	);

	it.each( [
		[ 'only Auto-fix for a delete fix', 'delete', true, [ 'Auto-fix it' ] ],
		[ 'Delete plugin where the plan can’t fix', 'delete', false, [ 'Delete plugin' ] ],
		[ 'both for a fix that doesn’t delete', 'replace', true, [ 'Delete plugin', 'Auto-fix it' ] ],
	] as const )( 'offers %s', ( _name, fixer, canAct, expected ) => {
		const threat = threatIn( 6, fixer );
		render(
			<ThreatDetails
				threat={ {
					...threat,
					extension: {
						...threat.extension!,
						actions: {
							delete: true,
							// Any other link skips SoftwareActions' early return.
							details: 'https://wordpress.org/plugins/akismet/',
						},
					},
				} }
				canAct={ canAct }
			/>
		);

		const shown = [ 'Delete plugin', 'Auto-fix it' ].filter( name =>
			screen.queryByRole( 'button', { name } )
		);
		expect( shown ).toEqual( expected );
	} );

	it.each( [
		[ undefined, null ],
		[ null, null ],
		[ 5, 'Critical severity' ],
	] )( 'shows severity %p as %p', ( severity, label ) => {
		render( <ThreatDetails threat={ { ...threatIn( 4, 'update' ), severity } } canAct /> );

		expect( screen.queryByText( /severity$/ )?.textContent ?? null ).toBe( label );
	} );
} );
