import { act, renderHook, waitFor } from '@testing-library/react';
import { RegistryProvider, createRegistry } from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { fetchStats } from '../api';
import { forgetOriginOptions } from '../origin-options';
import { sendStore, useStats } from '../store';
import type { Period, Stats } from '../types';
import type { ReactNode } from 'react';

jest.mock( '../api', () => ( {
	fetchStats: jest.fn(),
	fetchStatus: jest.fn(),
	postAction: jest.fn(),
	errorMessage: () => 'error',
} ) );
jest.mock( '../origin-options', () => ( { forgetOriginOptions: jest.fn() } ) );

const makeStats = ( tests: number ) => ( { tests } ) as unknown as Stats;

// A registry per test, so one test's stats never stand in for another's.
const setup = () => {
	const registry = createRegistry();
	registry.register( sendStore );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( RegistryProvider, { value: registry }, children );
	return { registry, wrapper };
};

beforeEach( () => jest.mocked( fetchStats ).mockReset() );

describe( 'sendStore logChanged', () => {
	it( 'reads the stats again and drops the Source options, keeping the old stats meanwhile', async () => {
		const { registry } = setup();
		const before = makeStats( 0 );
		const after = makeStats( 1 );
		jest.mocked( fetchStats ).mockResolvedValueOnce( before ).mockResolvedValueOnce( after );
		await expect( registry.resolveSelect( sendStore ).getStats( 'r7' ) ).resolves.toBe( before );

		registry.dispatch( sendStore ).logChanged();

		expect( forgetOriginOptions ).toHaveBeenCalled();
		expect( registry.select( sendStore ).getLogVersion() ).toBe( 1 );
		expect( registry.select( sendStore ).getStats( 'r7' ) ).toBe( before );
		await expect( registry.resolveSelect( sendStore ).getStats( 'r7' ) ).resolves.toBe( after );
		expect( fetchStats ).toHaveBeenCalledTimes( 2 );
		expect( fetchStats ).toHaveBeenLastCalledWith( { range: 7 } );
	} );
} );

describe( 'useStats', () => {
	it( 'keeps the last stats on screen while another period loads', async () => {
		const { wrapper } = setup();
		const ninety = makeStats( 90 );
		const custom = makeStats( 5 );
		let finish: ( stats: Stats ) => void = () => undefined;
		jest
			.mocked( fetchStats )
			.mockImplementation( period =>
				'range' in period
					? Promise.resolve( ninety )
					: new Promise< Stats >( resolve => ( finish = resolve ) )
			);

		const { result, rerender } = renderHook( ( { period } ) => useStats( period ), {
			wrapper,
			initialProps: { period: { range: 90 } as Period },
		} );
		expect( result.current ).toMatchObject( { stats: null, refreshing: false } );
		await waitFor( () => expect( result.current.stats ).toBe( ninety ) );
		expect( result.current.refreshing ).toBe( false );

		rerender( { period: { start: '2026-10-01', end: '2026-10-19' } } );
		expect( result.current ).toMatchObject( { stats: ninety, refreshing: true, error: null } );
		await waitFor( () =>
			expect( fetchStats ).toHaveBeenLastCalledWith( { start: '2026-10-01', end: '2026-10-19' } )
		);
		expect( result.current.refreshing ).toBe( true );

		await act( async () => finish( custom ) );
		await waitFor( () => expect( result.current.stats ).toBe( custom ) );
		expect( result.current.refreshing ).toBe( false );
	} );
} );
