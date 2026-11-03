import { renderHook } from '@testing-library/react';
import useOpenThreat from '../sections/use-open-threat';
import type { ScanThreat } from '../sections/scan/types';

const mockNavigate = jest.fn();
jest.mock( '@wordpress/route', () => ( { useNavigate: () => mockNavigate } ) );

describe( 'useOpenThreat', () => {
	it.each( [
		[ 'an active threat on Overview', 'current', { tab: undefined, threat: '7' } ],
		[
			'an ignored threat in History',
			'ignored',
			{ tab: 'history', status: 'ignored', threat: '7' },
		],
		[ 'a fixed threat in History', 'fixed', { tab: 'history', historyThreat: '7' } ],
	] )( 'opens %s, closing the other inspector', ( _name, status, expected ) => {
		const { result } = renderHook( () => useOpenThreat() );

		result.current( { id: 7, status } as ScanThreat );

		const { search } = mockNavigate.mock.lastCall[ 0 ];
		expect( search( { tab: 'settings', threat: '1', historyThreat: '2' } ) ).toEqual( {
			threat: undefined,
			historyThreat: undefined,
			status: undefined,
			...expected,
		} );
	} );
} );
