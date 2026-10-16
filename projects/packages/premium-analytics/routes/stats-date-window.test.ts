/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
/**
 * Internal dependencies
 */
import { dateWindowKey, takeDateWindowNotice } from './date-window-notice';
import { isPlanDateLimitedSection, limitStatsDateSearch } from './stats-date-window';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

const LOCKED = { description: 'Compare.', support_url: '', upgrade_url: '' };

/**
 * The notice the page would show on landing on a search, if any.
 *
 * @param search - The search the page shows.
 * @return The queued feature, or undefined.
 */
const noticeOn = ( search: Record< string, unknown > | undefined ) =>
	takeDateWindowNotice( dateWindowKey( search ?? {}, '/' ) );

/**
 * Publish plan gates that lock the given features.
 *
 * @param lockedFeatures - Locked feature slugs.
 * @param sections       - Dashboard section slugs.
 */
function setGates(
	lockedFeatures: Record< string, typeof LOCKED >,
	sections = [ 'traffic', 'store' ]
) {
	( getScriptData as jest.Mock ).mockReturnValue( {
		premium_analytics: {
			sections,
			plan_gates: {
				tier: 'free',
				locked_features: lockedFeatures,
				locked_widget_types: {},
			},
		},
	} );
}

beforeEach( () => {
	jest.useFakeTimers().setSystemTime( new Date( '2026-10-15T12:00:00Z' ) );
	setGates( { 'recent-7-days': LOCKED } );
} );

afterEach( () => {
	jest.useRealTimers();
	takeDateWindowNotice( '' );
} );

describe( 'limitStatsDateSearch', () => {
	it( 'stays quiet when the page reset the window itself, such as a post opening on all time', () => {
		const seeded = {
			preset: 'all-time',
			from: '2005-01-01',
			to: '2026-10-15',
			interval: 'month',
		};
		const requested = { from: '2026-10-10', to: '2026-10-14' };

		const limited = limitStatsDateSearch( seeded, { pathname: '/', requested } );

		expect( limited ).toMatchObject( { preset: 'last-7-days' } );
		expect( noticeOn( limited ) ).toBeUndefined();
	} );
} );

describe( 'isPlanDateLimitedSection', () => {
	it.each( [
		[ 'traffic', [ 'traffic', 'store' ], true ],
		[ 'store', [ 'traffic', 'store' ], false ],
		[ undefined, [ 'traffic', 'store' ], true ],
		[ undefined, [ 'store' ], false ],
		[ 'unknown-tab', [ 'traffic' ], true ],
	] )( 'resolves %p among %p to %p', ( section, sections, expected ) => {
		setGates( { 'recent-7-days': LOCKED }, sections );

		expect( isPlanDateLimitedSection( section ) ).toBe( expected );
	} );
} );
