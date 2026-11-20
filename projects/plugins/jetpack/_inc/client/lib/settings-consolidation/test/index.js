import { getScriptData, isWoASite } from '@automattic/jetpack-script-data';
import { userCanManageModules } from 'state/initial-state';
import {
	areStatsSettingsMovedOut,
	getMovedOutModules,
	hasTrafficCardsLeft,
	isInSettingsPanel,
	isSettingsConsolidationEnabled,
} from '../index';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
	isWoASite: jest.fn(),
} ) );
jest.mock( 'state/initial-state', () => ( {
	...jest.requireActual( 'state/initial-state' ),
	userCanManageModules: jest.fn(),
} ) );

describe( 'isSettingsConsolidationEnabled', () => {
	it.each( [
		[ 'is on', { myJetpack: { settingsConsolidation: true } }, true ],
		[ 'is off', { myJetpack: { settingsConsolidation: false } }, false ],
		[ 'is missing from an older My Jetpack', { myJetpack: {} }, false ],
		[ 'has no My Jetpack data', {}, false ],
	] )( 'reads the flag when it %s', ( _label, data, expected ) => {
		getScriptData.mockReturnValue( data );

		expect( isSettingsConsolidationEnabled() ).toBe( expected );
	} );
} );

describe( 'getMovedOutModules', () => {
	it.each( [
		[ 'adds', 'on WoA', true, [ 'earn', 'wpcom-reader' ] ],
		[ 'leaves out', 'elsewhere', false, [ 'earn' ] ],
	] )( '%s the Reader %s', ( _verb, _where, woa, expected ) => {
		getScriptData.mockReturnValue( { myJetpack: { settingsConsolidation: true } } );
		isWoASite.mockReturnValue( woa );

		expect( getMovedOutModules() ).toEqual( expected );
	} );
} );

describe( 'isInSettingsPanel', () => {
	it.each( [
		[ 'moves', 'admins with the flag on', true, true, true ],
		[ 'keeps', 'users who cannot manage modules', true, false, false ],
		[ 'keeps', 'admins with the flag off', false, true, false ],
	] )( '%s the card for %s', ( _verb, _who, flag, canManage, expected ) => {
		getScriptData.mockReturnValue( { myJetpack: { settingsConsolidation: flag } } );
		userCanManageModules.mockReturnValue( canManage );

		expect( isInSettingsPanel( {} ) ).toBe( expected );
	} );
} );

describe( 'hasTrafficCardsLeft', () => {
	const ANALYTICS = { enabled: true, page_slug: 'stats-v2', can_view: true, timezone: 'UTC' };

	it.each( [
		[ 'nothing once Stats links to its own page', {}, false, [ 'stats' ], true, false ],
		[ 'the legacy SEO settings', { seo: {} }, false, [ 'seo-tools' ], true, true ],
		[ 'Google Analytics without its panel', {}, true, [ 'stats' ], true, true ],
		[
			'nothing once Google Analytics has its panel',
			{ myJetpack: { googleAnalyticsPanel: 'url' } },
			true,
			[],
			true,
			false,
		],
		[ 'classic Stats', {}, false, [ 'stats' ], false, true ],
		[
			'nothing once Stats v2 holds the Stats settings',
			{ analytics: ANALYTICS },
			false,
			[ 'stats' ],
			false,
			false,
		],
	] )( 'finds %s', ( _what, data, woa, modules, odyssey, expected ) => {
		getScriptData.mockReturnValue( {
			seo: { surface_visible: true },
			...data,
			myJetpack: { settingsConsolidation: true, ...data.myJetpack },
		} );
		isWoASite.mockReturnValue( woa );
		const state = {
			jetpack: {
				initialState: { isOdysseyStatsEnabled: odyssey },
				modules: { items: Object.fromEntries( modules.map( slug => [ slug, {} ] ) ) },
			},
		};

		expect( hasTrafficCardsLeft( state ) ).toBe( expected );
	} );

	it( 'finds classic Stats before setInitialState() fills the modules slice', () => {
		getScriptData.mockReturnValue( {
			seo: { surface_visible: true },
			myJetpack: { settingsConsolidation: true },
		} );
		isWoASite.mockReturnValue( false );
		const state = {
			jetpack: {
				initialState: { isOdysseyStatsEnabled: false, getModules: { stats: {} } },
				modules: { items: {} },
			},
		};

		expect( hasTrafficCardsLeft( state ) ).toBe( true );
	} );
} );

describe( 'areStatsSettingsMovedOut', () => {
	it( 'keeps the Stats settings here while the settings flag is off', () => {
		getScriptData.mockReturnValue( { myJetpack: { settingsConsolidation: false } } );

		expect(
			areStatsSettingsMovedOut( { jetpack: { initialState: { isOdysseyStatsEnabled: true } } } )
		).toBe( false );
	} );
} );
