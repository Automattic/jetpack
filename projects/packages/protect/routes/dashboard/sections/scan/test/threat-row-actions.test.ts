import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { deleteSoftware, fixThreat } from '../threat-actions';
import { useThreatRowActions } from '../threat-row-actions';
import type { ScanThreat } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const open = jest.fn();

const threatIn = ( id: number ): ScanThreat => ( {
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

const eligibleIds = ( actions: ReturnType< typeof useThreatRowActions >, item: ScanThreat ) =>
	actions.filter( action => ! action.isEligible || action.isEligible( item ) ).map( a => a.id );

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
} );
