/**
 * Internal dependencies
 */
import { getStatsMock } from './register-stats-mocks';

const STATS_BASE = '/jetpack-premium-analytics/v1/proxy/v1.1/stats';

describe( 'getStatsMock', () => {
	it( 'keeps the standalone clicks report mocked', () => {
		expect( getStatsMock( `${ STATS_BASE }/clicks?period=day` ) ).not.toBeNull();
	} );

	it( 'lets email clicks timelines fall through to the report mocks', () => {
		expect(
			getStatsMock( `${ STATS_BASE }/clicks/emails/1234?period=day&stats_fields=timeline` )
		).toBeNull();
	} );
} );
