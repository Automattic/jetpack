import { act, renderHook, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { resetScan } from '../store';
import * as threatActions from '../threat-actions';
import { deleteSoftware, fixThreat } from '../threat-actions';
import { useThreatRowActions } from '../threat-row-actions';
import type { ScanThreat } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const open = jest.fn();

const threatIn = ( id: number | string ): ScanThreat => ( {
	id,
	title: 'Vulnerable plugin',
	fixable: { fixer: 'update' },
	extension: {
		type: 'plugins',
		slug: 'akismet',
		name: 'Akismet',
		version: '1.0',
		actions: { delete: true },
	},
} );

type Actions = ReturnType< typeof useThreatRowActions >;

const eligibleIds = ( actions: Actions, item: ScanThreat ) =>
	actions.filter( action => ! action.isEligible || action.isEligible( item ) ).map( a => a.id );

const autoFix = ( actions: Actions ) => {
	const action = actions.find( item => item.id === 'auto-fix' );
	return action && 'callback' in action ? action.callback : () => {};
};

describe( 'useThreatRowActions', () => {
	afterEach( () => {
		jest.useRealTimers();
		document.body.innerHTML = '';
	} );

	it.each( [
		[ 'a fix', 1, ( item: ScanThreat ) => fixThreat( item ), [ 'view' ] ],
		[
			'a delete, so its modal stays open',
			2,
			( item: ScanThreat ) => deleteSoftware( item ),
			[ 'view', 'auto-fix', 'delete', 'ignore' ],
		],
	] )( 'limits a row’s actions while %s runs', ( _name, id, start, expected ) => {
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );
		const item = threatIn( id );
		const { result } = renderHook( () => useThreatRowActions( open, true ) );
		expect( eligibleIds( result.current, item ) ).toContain( 'auto-fix' );

		act( () => void start( item ) );

		expect( eligibleIds( result.current, item ) ).toEqual( expected );
	} );

	it.each( [
		[ 'an update fix', { fixer: 'update' }, [ 'auto-fix' ] ],
		[ 'a delete fix', { fixer: 'delete' }, [ 'auto-fix-delete' ] ],
		[
			'a fix left out of bulk fixes',
			{ fixer: 'update', extras: { isBulkFixable: false } },
			[ 'auto-fix' ],
		],
	] as const )( 'picks the Auto-fix action for %s', ( _name, fixable, expected ) => {
		const item = { ...threatIn( 4 ), signature: 'Vulnerable.WP.Extension', fixable };
		const { result } = renderHook( () => useThreatRowActions( open, true ) );

		expect(
			eligibleIds( result.current, item ).filter( id => id.startsWith( 'auto-fix' ) )
		).toEqual( expected );
	} );

	it( 'gives a row its actions back when the fix fails', async () => {
		let reject: ( e: unknown ) => void = () => {};
		mockApiFetch.mockReturnValue( new Promise( ( _resolve, fail ) => ( reject = fail ) ) );
		const item = threatIn( 3 );
		const { result } = renderHook( () => useThreatRowActions( open, true ) );

		act( () => autoFix( result.current )( [ item ], {} as never ) );
		expect( eligibleIds( result.current, item ) ).toEqual( [ 'view' ] );
		await act( async () => reject( { message: 'Nope' } ) );

		expect( eligibleIds( result.current, item ) ).toContain( 'auto-fix' );
	} );

	it.each( [
		[ 'moves focus to the threat’s row once the clicked button is gone', true, 'Threat' ],
		[ 'leaves focus alone while the clicked button stays', false, 'Auto-fix' ],
	] )( '%s', ( _name, removeClicked, focused ) => {
		jest.useFakeTimers();
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );
		const item = threatIn( `plugins-contact-form-7/wp-contact-form-7.php-${ focused }` );
		document.body.innerHTML = `<button data-threat-id="${ item.id }">Threat</button><button>Auto-fix</button>`;
		const clicked = screen.getByRole( 'button', { name: 'Auto-fix' } );
		clicked.focus();
		const { result } = renderHook( () => useThreatRowActions( open, true ) );

		act( () => autoFix( result.current )( [ item ], {} as never ) );
		if ( removeClicked ) {
			clicked.remove();
		}
		act( () => jest.runAllTimers() );

		expect( screen.getByRole( 'button', { name: focused } ) ).toHaveFocus();
	} );
} );

describe( 'useThreatRowActions with bulk actions', () => {
	const BULK = [ 'auto-fix', 'ignore' ];
	const threats = [ threatIn( 10 ), threatIn( 11 ) ];

	// Scan history and the threat report pass no onBulk, so they must not grow checkboxes.
	it( 'offers bulk Auto-fix and Ignore only to a list that handles them', () => {
		const supportsBulk = ( onBulk?: () => void ) =>
			renderHook( () => useThreatRowActions( open, true, onBulk ) )
				.result.current.filter( action => action.supportsBulk )
				.map( action => action.id );

		expect( supportsBulk() ).toEqual( [] );
		expect( supportsBulk( jest.fn() ) ).toEqual( BULK );
	} );

	it.each( [
		[ 'auto-fix', 'fixThreats' ],
		[ 'ignore', 'ignoreThreats' ],
	] as const )( '%s hands the list the threats it acts on', ( id, name ) => {
		const run = jest.spyOn( threatActions, name ).mockResolvedValue();
		const onBulk = jest.fn();
		const { result } = renderHook( () => useThreatRowActions( open, true, onBulk ) );
		const action = result.current.find( item => item.id === id );

		act( () =>
			( action as { callback: ( items: ScanThreat[], context: object ) => void } ).callback(
				threats,
				{}
			)
		);

		expect( onBulk ).toHaveBeenCalledWith( threats );
		expect( run ).toHaveBeenCalledWith( threats, expect.any( Function ) );
		run.mockRestore();
	} );
} );

describe( 'useThreatRowActions where the host decides about ignoring', () => {
	afterEach( () => {
		delete window.jetpackProtectDashboard;
		resetScan();
	} );

	it.each( [
		[ 'ignore', 'current', false ],
		[ 'unignore', 'ignored', true ],
	] as const )(
		'with ignoring turned off, %s on a %s threat is offered: %s',
		( id, status, offered ) => {
			const threat = { ...threatIn( 20 ), status };
			const isEligible = ( canIgnore: boolean ) => {
				window.jetpackProtectDashboard = { scan: { hasPlan: true, url: '', canIgnore } };
				resetScan();
				return renderHook( () => useThreatRowActions( open, true ) )
					.result.current.find( action => action.id === id )
					?.isEligible?.( threat );
			};

			expect( isEligible( true ) ).toBe( true );
			expect( isEligible( false ) ).toBe( offered );
		}
	);
} );
