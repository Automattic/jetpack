/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { DASHBOARD_PREFERENCES_SCOPE } from '@jetpack-premium-analytics/data';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
/**
 * Internal dependencies
 */
import { DATE_FILTER_RANGE, DATE_FILTER_YEAR, type DashboardSection } from './config';
import { dateWindowForSectionSwitch } from './section-date-window';

jest.mock(
	'@automattic/jetpack-script-data',
	() => jest.requireActual( '../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);

const SECTIONS = Object.fromEntries(
	[
		[ 'traffic', DATE_FILTER_RANGE ],
		[ 'store', DATE_FILTER_RANGE ],
		[ 'insights', DATE_FILTER_YEAR ],
	].map( ( [ slug, dateFilter ], order ) => [
		slug,
		{ id: slug, slug, label: slug, order, date_filter: dateFilter, default_layout: [] },
	] )
) as Record< string, DashboardSection >;

const LOCKED = { description: '', support_url: '', upgrade_url: '' };
const FREE = [ 'recent-7-days', 'long-date-presets', 'intervals' ];
const LEGACY_BASIC = [ 'long-date-presets', 'intervals' ];

const YEAR_TO_DATE = {
	preset: 'year-to-date',
	from: '2026-01-01T00:00:00',
	to: '2026-10-15T23:59:59',
	interval: 'month',
};
const COMPARED = {
	comp: '1',
	compare_from: '2025-01-01T00:00:00',
	compare_to: '2025-10-15T23:59:59',
	compare_preset: 'previous-year',
};
const YESTERDAY = {
	preset: 'yesterday',
	from: '2026-10-14T00:00:00',
	to: '2026-10-14T23:59:59',
	interval: 'day',
};
const LAST_30_DAYS = {
	preset: 'last-30-days',
	from: '2026-09-16T00:00:00',
	to: '2026-10-15T23:59:59',
	interval: 'day',
};

// The reader applied year to date on Store, so it is also their remembered preset.
beforeEach( () => {
	jest.useFakeTimers().setSystemTime( new Date( '2026-10-15T12:00:00Z' ) );
	dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', 'year-to-date' );
} );

afterEach( () => {
	jest.useRealTimers();
	dispatch( preferencesStore ).set( DASHBOARD_PREFERENCES_SCOPE, 'datePreset', undefined );
} );

describe( 'dateWindowForSectionSwitch', () => {
	it.each( [
		[
			'free carries year to date into Traffic',
			FREE,
			'traffic',
			YEAR_TO_DATE,
			expect.objectContaining( {
				preset: 'last-7-days',
				comp: undefined,
				compare_preset: undefined,
			} ),
		],
		[
			'legacy basic carries a compared year to date into Traffic',
			LEGACY_BASIC,
			'traffic',
			{ ...YEAR_TO_DATE, ...COMPARED },
			expect.objectContaining( {
				preset: 'last-30-days',
				comp: '1',
				compare_preset: 'previous-period',
			} ),
		],
		[ 'free carries yesterday into Traffic', FREE, 'traffic', YESTERDAY, undefined ],
		[
			'legacy basic carries a custom comparison into Traffic',
			LEGACY_BASIC,
			'traffic',
			{ ...LAST_30_DAYS, ...COMPARED },
			undefined,
		],
		[ 'free carries year to date into Store', FREE, 'store', YEAR_TO_DATE, undefined ],
		[
			'an open plan carries a range into Insights',
			[],
			'insights',
			YESTERDAY,
			expect.objectContaining( { preset: 'all-time', interval: 'month' } ),
		],
	] )( 'when %s', ( _case, features, section, search, expected ) => {
		( getScriptData as jest.Mock ).mockReturnValue( {
			premium_analytics: {
				sections: [ 'traffic', 'store', 'insights' ],
				plan_gates: {
					tier: 'free',
					locked_features: Object.fromEntries( features.map( key => [ key, LOCKED ] ) ),
					locked_widget_types: {},
				},
			},
		} );

		const carried = dateWindowForSectionSwitch( section, SECTIONS[ section ], {
			...search,
			section: 'store',
		} );

		expect( carried ).toEqual( expected );
	} );
} );
