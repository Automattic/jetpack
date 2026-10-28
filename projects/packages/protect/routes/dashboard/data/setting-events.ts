import { recordEvent } from './tracks';
import type { ProtectSettings } from './use-protect-settings';

type TracksEvent = [ name: string, properties?: Record< string, string > ];
type EventFor = ( value: unknown ) => TracksEvent;

const onOff =
	( on: string, off: string ): EventFor =>
	value => [ value ? on : off ];
const updated =
	( name: string ): EventFor =>
	() => [ name ];
// Jetpack Settings' events, for the toggles only it had.
const moduleToggle =
	( module: string ): EventFor =>
	value => [ 'jetpack_wpa_module_toggle', { module, toggled: value ? 'on' : 'off' } ];
const moduleSetting =
	( module: string, setting: string ): EventFor =>
	value => [ 'jetpack_wpa_settings_toggle', { module, setting, toggled: value ? 'on' : 'off' } ];

/** The event each saved setting records, named as on the screen that had it before. */
const SETTING_EVENTS: Record< string, EventFor > = {
	waf: moduleToggle( 'waf' ),
	jetpack_waf_automatic_rules: onOff(
		'jetpack_protect_automatic_rules_enabled',
		'jetpack_protect_automatic_rules_disabled'
	),
	jetpack_waf_ip_block_list_enabled: onOff(
		'jetpack_protect_ip_block_list_enabled',
		'jetpack_protect_ip_block_list_disabled'
	),
	jetpack_waf_ip_allow_list_enabled: onOff(
		'jetpack_protect_ip_allow_list_enabled',
		'jetpack_protect_ip_allow_list_disabled'
	),
	jetpack_waf_ip_block_list: updated( 'jetpack_protect_ip_block_list_updated' ),
	jetpack_waf_ip_allow_list: updated( 'jetpack_protect_ip_allow_list_updated' ),
	jetpack_waf_share_data: onOff(
		'jetpack_protect_share_data_enabled',
		'jetpack_protect_share_data_disabled'
	),
	jetpack_waf_share_debug_data: onOff(
		'jetpack_protect_share_debug_data_enabled',
		'jetpack_protect_share_debug_data_disabled'
	),
	protect: onOff(
		'jetpack_protect_brute_force_protection_enabled',
		'jetpack_protect_brute_force_protection_disabled'
	),
	'account-protection': moduleToggle( 'account-protection' ),
	sso: moduleToggle( 'sso' ),
	jetpack_sso_match_by_email: moduleSetting( 'sso', 'jetpack_sso_match_by_email' ),
	jetpack_sso_require_two_step: moduleSetting( 'sso', 'jetpack_sso_require_two_step' ),
	monitor: moduleToggle( 'monitor' ),
	monitor_receive_notifications: moduleSetting( 'monitor', 'monitor_receive_notifications' ),
};

/**
 * Record an event for each setting a save changed.
 *
 * @param patch  - The saved values.
 * @param before - The values before the save, or null when not loaded yet.
 */
export function recordSettingEvents( patch: ProtectSettings, before: ProtectSettings | null ) {
	Object.entries( patch ).forEach( ( [ key, value ] ) => {
		const eventFor = SETTING_EVENTS[ key ];
		// Linked saves also write settings that were already at the new value; those aren't changes.
		if ( ! eventFor || ( before && key in before && before[ key ] === value ) ) {
			return;
		}
		recordEvent( ...eventFor( value ) );
	} );
}
