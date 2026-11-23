import { getAdsSettingsData } from '../ads-settings-data';

let mockSimple = false;

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => mockSimple,
	getScriptData: () => ( {
		monetize: {
			sections: { ads: { hasWordAds: true } },
			adsSettings: mockSimple ? undefined : { hasWordAds: false, moduleOverride: 'active' },
		},
	} ),
} ) );

describe( 'getAdsSettingsData', () => {
	it.each( [
		[ 'the Jetpack plugin’s data', false, { hasWordAds: false, moduleOverride: 'active' } ],
		[
			'the Ads section’s state on Simple, which the plugin prints nothing for',
			true,
			{ hasWordAds: true, hasConnectedOwner: true, moduleOverride: false },
		],
	] )( 'reads %s', ( _case, simple, expected ) => {
		mockSimple = simple;

		expect( getAdsSettingsData() ).toMatchObject( expected );
	} );
} );
