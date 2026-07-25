import { getStatsQueryEnabled } from '../use-stats-query';
import type { UseQueryOptions } from '@tanstack/react-query';

describe( 'Stats query hook helpers', () => {
	it( 'preserves query enabled state when no caller override is passed', () => {
		expect( getStatsQueryEnabled( { queryKey: [ 'stats' ], enabled: false } ) ).toBe( false );
		expect( getStatsQueryEnabled( { queryKey: [ 'stats' ], enabled: true } ) ).toBe( true );
		expect( getStatsQueryEnabled( { queryKey: [ 'stats' ] } ) ).toBeUndefined();
	} );

	it( 'does not let caller options force-enable a disabled query', () => {
		const queryOptions = {
			queryKey: [ 'stats' ],
			enabled: false,
		} satisfies UseQueryOptions;

		expect( getStatsQueryEnabled( queryOptions, { enabled: true } ) ).toBe( false );
		expect( getStatsQueryEnabled( queryOptions, { enabled: false } ) ).toBe( false );
	} );

	it( 'allows caller options to disable an otherwise enabled query', () => {
		const queryOptions = {
			queryKey: [ 'stats' ],
			enabled: true,
		} satisfies UseQueryOptions;

		expect( getStatsQueryEnabled( queryOptions, { enabled: false } ) ).toBe( false );
		expect( getStatsQueryEnabled( queryOptions, { enabled: true } ) ).toBe( true );
	} );

	it( 'preserves a function predicate enabled instead of collapsing it to a boolean', () => {
		const predicate = () => true;
		const queryOptions = {
			queryKey: [ 'stats' ],
			enabled: predicate,
		} satisfies UseQueryOptions;

		expect( getStatsQueryEnabled( queryOptions ) ).toBe( predicate );
		expect( getStatsQueryEnabled( queryOptions, { enabled: true } ) ).toBe( predicate );
		expect( getStatsQueryEnabled( queryOptions, { enabled: false } ) ).toBe( false );
	} );
} );
