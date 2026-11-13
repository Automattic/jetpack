import { getScriptData, isWoASite } from '@automattic/jetpack-script-data';
import { getMovedOutModules, isSettingsConsolidationEnabled } from '../index';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: jest.fn(),
	isWoASite: jest.fn(),
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
