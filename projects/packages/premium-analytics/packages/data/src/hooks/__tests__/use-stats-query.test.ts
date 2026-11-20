import { getStatsQueryEnabled } from '../use-stats-query';
import type { UseStatsOptions } from '../use-stats-report';
import type { UseQueryOptions } from '@tanstack/react-query';

const predicate = () => true;

describe( 'Stats query hook helpers', () => {
	it.each< [ string, UseQueryOptions[ 'enabled' ], UseStatsOptions | undefined, unknown ] >( [
		[ 'does not let the caller force-enable a disabled query', false, { enabled: true }, false ],
		[ 'lets the caller disable an otherwise enabled query', true, { enabled: false }, false ],
		[
			'keeps a function predicate instead of collapsing it to a boolean',
			predicate,
			{ enabled: true },
			predicate,
		],
		[
			'leaves enabled unset when neither the query nor the caller sets it',
			undefined,
			undefined,
			undefined,
		],
	] )( '%s', ( _title, enabled, options, expected ) => {
		expect( getStatsQueryEnabled( { queryKey: [ 'stats' ], enabled }, options ) ).toBe( expected );
	} );
} );
