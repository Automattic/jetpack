import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { resetScan, setScan } from '../store';
import { ignoreThreat, resetThreatActions } from '../threat-actions';
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

	afterEach( resetThreatActions );

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
		let endFix: ( status: { status: string } ) => void = () => {};
		mockApiFetch.mockReturnValue( new Promise( resolve => ( endFix = resolve ) ) );
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

		act( () => endFix( { status: 'not_fixed' } ) );
		await expect(
			screen.findByRole( 'button', { name: 'Auto-fix it' } )
		).resolves.toBeInTheDocument();
	} );

	it.each( [
		[
			'an active plugin',
			'plugins',
			'Extension',
			undefined,
			'active',
			'current',
			'deactivate and delete this plugin',
		],
		[
			'an inactive plugin',
			'plugins',
			'Extension',
			undefined,
			'inactive',
			'current',
			'delete this plugin.',
		],
		[
			'the active theme',
			'themes',
			'Extension',
			undefined,
			'active',
			'current',
			'switch to another theme',
		],
		[
			'a parent theme',
			'themes',
			'Extension',
			undefined,
			'parent',
			'current',
			'built on this one',
		],
		[
			'an unused theme',
			'themes',
			'Extension',
			undefined,
			'inactive',
			'current',
			'delete this theme.',
		],
		[
			'WordPress',
			undefined,
			'Core',
			undefined,
			undefined,
			'current',
			'update WordPress as soon as',
		],
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

	describe( 'for a vulnerability with no fixed version', () => {
		afterEach( resetScan );

		it.each( [
			[
				'an unfixed plugin on the free check',
				'plugins',
				'Extension',
				undefined,
				undefined,
				false,
				'plugin',
			],
			[
				'an unfixed theme on the free check',
				'themes',
				'Extension',
				undefined,
				undefined,
				false,
				'theme',
			],
			[ 'a plugin with a fixed version', 'plugins', 'Extension', '2.0.2', 'current', false, null ],
			[ 'a fixed plugin', 'plugins', 'Extension', undefined, 'fixed', false, null ],
			[ 'WordPress', undefined, 'Core', undefined, 'current', false, null ],
			[
				'a plugin Scan has no update fixer for',
				'plugins',
				'Extension',
				undefined,
				'current',
				true,
				null,
			],
			[
				'an ignored plugin, which needs no explanation even on the free check',
				'plugins',
				'Extension',
				undefined,
				'ignored',
				false,
				null,
			],
		] as const )(
			'explains it and suggests the developer for %s: %p',
			( _name, type, signature, fixedIn, status, hasPlan, developer ) => {
				setScan( scan => ( { ...scan, hasPlan } ) );
				const threat: ScanThreat = {
					id: 4,
					signature: `Vulnerable.WP.${ signature }`,
					title: 'Vulnerable software',
					status,
					fixedIn,
					extension: type && { type, slug: 'akismet', name: 'Akismet', version: '4.8.2' },
				};
				render( <ThreatDetails threat={ threat } canAct={ false } /> );

				expect( !! screen.queryByText( /treats your version as affected/ ) ).toBe( !! developer );
				expect(
					screen.queryByText( /false positive, contact the (plugin|theme)’s developer/ )
						?.textContent ?? null
				).toBe(
					developer &&
						`If you believe this is a false positive, contact the ${ developer }’s developer and share the vulnerability details with them so they can address it.`
				);
			}
		);
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
		[ 'a free site that can ignore', { hasPlan: false, freeIgnore: true }, true ],
		[ 'a free site that can’t', { hasPlan: false, freeIgnore: false }, false ],
		[ 'Scan history, which is read-only', { hasPlan: true }, false ],
	] )( 'offers Ignore it without canAct on %s: %p', ( _name, plan, offered ) => {
		setScan( scan => ( { ...scan, ...plan } ) );
		render( <ThreatDetails threat={ threatIn( 7, 'replace' ) } canAct={ false } /> );

		expect( !! screen.queryByRole( 'button', { name: 'Ignore it' } ) ).toBe( offered );
		resetScan();
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
