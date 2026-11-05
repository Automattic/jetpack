import { act, render, screen, waitFor } from '@testing-library/react';
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

	it( 'starts a delete fix and closes the confirmation once the slug is typed', async () => {
		render( <ThreatDetails threat={ threatIn( 6, 'delete' ) } canAct /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Auto-fix it' } ) );
		await userEvent.type( screen.getByRole( 'textbox' ), 'akismet' );
		await userEvent.click( screen.getByRole( 'button', { name: 'Confirm deletion' } ) );

		expect( mockApiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { path: expect.stringContaining( '/threats/6/fix' ) } )
		);
		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: 'Confirm deletion' } ) ).not.toBeInTheDocument()
		);
		expect( screen.getByRole( 'button', { name: 'Fixing…' } ) ).toBeInTheDocument();
	} );

	it.each( [
		[
			'an active plugin',
			'plugins',
			'Extension',
			undefined,
			'active',
			'current',
			'Deactivate and delete',
		],
		[
			'an inactive plugin',
			'plugins',
			'Extension',
			undefined,
			'inactive',
			'current',
			'Delete it until',
		],
		[
			'the active theme',
			'themes',
			'Extension',
			undefined,
			'active',
			'current',
			'Switch to another',
		],
		[ 'a parent theme', 'themes', 'Extension', undefined, 'parent', 'current', 'built on it' ],
		[
			'an unused theme',
			'themes',
			'Extension',
			undefined,
			'inactive',
			'current',
			'Delete it until',
		],
		[ 'WordPress', undefined, 'Core', undefined, undefined, 'current', 'Update as soon as' ],
		[
			'a fixed plugin',
			'plugins',
			'Extension',
			undefined,
			'active',
			'fixed',
			'Review the affected',
		],
		[
			'a file in a plugin',
			'plugins',
			'Extension',
			'wp-content/plugins/akismet/x.php',
			'active',
			'current',
			'Review the affected',
		],
	] as const )(
		'advises on unfixable %s',
		( _name, type, signature, filename, state, status, advice ) => {
			const threat: ScanThreat = {
				id: 4,
				signature: `Vulnerable.WP.${ signature }`,
				title: 'Vulnerable software',
				status,
				filename,
				extension: type && { type, slug: 'akismet', name: 'Akismet', version: '1.0', state },
			};
			render( <ThreatDetails threat={ threat } canAct={ false } /> );

			expect( screen.getByText( advice, { exact: false } ) ).toBeInTheDocument();
		}
	);

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
		[ 'Delete plugin for an ignored delete fix', 'delete', true, [ 'Delete plugin' ], 'ignored' ],
	] as const )( 'offers %s', ( _name, fixer, canAct, expected, status = 'current' ) => {
		const threat: ScanThreat = {
			...threatIn( 6, fixer ),
			status: status as ScanThreat[ 'status' ],
		};
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
