import { act, renderHook, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
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

	it( 'moves focus to the threat’s row once starting the fix removes the clicked button', () => {
		jest.useFakeTimers();
		mockApiFetch.mockReturnValue( new Promise( () => {} ) );
		const item = threatIn( 'plugins-contact-form-7/wp-contact-form-7.php-5.3.1' );
		document.body.innerHTML = `<button data-threat-id="${ item.id }">Threat</button><button>Auto-fix</button>`;
		const clicked = screen.getByRole( 'button', { name: 'Auto-fix' } );
		clicked.focus();
		const { result } = renderHook( () => useThreatRowActions( open, true ) );

		act( () => autoFix( result.current )( [ item ], {} as never ) );
		clicked.remove();
		act( () => jest.runAllTimers() );

		expect( screen.getByRole( 'button', { name: 'Threat' } ) ).toHaveFocus();
		jest.useRealTimers();
	} );
} );
