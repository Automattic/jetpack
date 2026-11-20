import { recordSettingEvents } from '../setting-events';
import { recordEvent } from '../tracks';

jest.mock( '../tracks', () => ( { recordEvent: jest.fn() } ) );

const mockRecordEvent = recordEvent as jest.Mock;

describe( 'recordSettingEvents', () => {
	beforeEach( () => mockRecordEvent.mockReset() );

	it.each( [
		[
			'the Protect plugin’s event for a toggle it had',
			{ jetpack_waf_automatic_rules: true },
			{ jetpack_waf_automatic_rules: false },
			[ 'jetpack_protect_automatic_rules_enabled' ],
		],
		[
			'a toggle saved before settings loaded',
			{ protect: false },
			null,
			[ 'jetpack_protect_brute_force_protection_disabled' ],
		],
		[
			'an edited IP list',
			{ jetpack_waf_ip_block_list: '1.2.3.4' },
			{ jetpack_waf_ip_block_list: '' },
			[ 'jetpack_protect_ip_block_list_updated' ],
		],
		[
			'turning off sharing, which also clears detailed sharing that was already off',
			{ jetpack_waf_share_data: false, jetpack_waf_share_debug_data: false },
			{ jetpack_waf_share_data: true, jetpack_waf_share_debug_data: false },
			[ 'jetpack_protect_share_data_disabled' ],
		],
		[
			'turning on detailed sharing, which also turns on sharing',
			{ jetpack_waf_share_debug_data: true, jetpack_waf_share_data: true },
			{ jetpack_waf_share_debug_data: false, jetpack_waf_share_data: false },
			[ 'jetpack_protect_share_debug_data_enabled', 'jetpack_protect_share_data_enabled' ],
		],
		[
			'a module only Jetpack Settings could toggle',
			{ waf: true },
			{ waf: false },
			[ [ 'jetpack_wpa_module_toggle', { module: 'waf', toggled: 'on' } ] ],
		],
		[
			'an SSO option',
			{ jetpack_sso_require_two_step: false },
			{ jetpack_sso_require_two_step: true },
			[
				[
					'jetpack_wpa_settings_toggle',
					{ module: 'sso', setting: 'jetpack_sso_require_two_step', toggled: 'off' },
				],
			],
		],
		[ 'nothing for a setting with no event', { unrelated_setting: true }, {}, [] ],
	] )( 'records %s', ( _, patch, before, expected ) => {
		recordSettingEvents( patch, before );

		expect( mockRecordEvent.mock.calls ).toEqual(
			expected.map( event => ( Array.isArray( event ) ? event : [ event ] ) )
		);
	} );
} );
