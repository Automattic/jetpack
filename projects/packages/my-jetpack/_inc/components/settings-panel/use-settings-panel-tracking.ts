import { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';

// The old Settings screen's event names, so its baseline carries over; `origin` tells the panel apart.
const ORIGIN = 'my-jetpack-settings-panel';
const EVENT_VERSION = 1;

const toggled = ( active: boolean ) => ( active ? 'on' : 'off' );

/**
 * Records the panel's events: its open and close, and a module's switches, options and links.
 *
 * @param module - The module slug, or the settings entry slug.
 * @return Functions to call as each save starts, as a link is clicked, or as the panel opens or closes.
 */
export function useSettingsPanelTracking( module: string ) {
	const { recordEvent } = useAnalytics();

	const trackModuleToggle = useCallback(
		( active: boolean ) => {
			recordEvent( 'jetpack_wpa_module_toggle', {
				module,
				toggled: toggled( active ),
				origin: ORIGIN,
				event_version: EVENT_VERSION,
			} );
		},
		[ module, recordEvent ]
	);

	const trackSettingToggle = useCallback(
		( setting: string, active: boolean ) => {
			recordEvent( 'jetpack_wpa_settings_toggle', {
				module,
				setting,
				toggled: toggled( active ),
				origin: ORIGIN,
				event_version: EVENT_VERSION,
			} );
		},
		[ module, recordEvent ]
	);

	// Pass a value for choice controls only; free text sends none.
	const trackSettingChange = useCallback(
		( setting: string, value?: string ) => {
			recordEvent( 'jetpack_wpa_settings_change', {
				module,
				setting,
				origin: ORIGIN,
				event_version: EVENT_VERSION,
				...( value === undefined ? {} : { value } ),
			} );
		},
		[ module, recordEvent ]
	);

	// The old screen's click event and targets, which carried no module.
	const trackClick = useCallback(
		( props: { target: string; feature?: string; extra?: string } ) => {
			recordEvent( 'jetpack_wpa_click', {
				...props,
				origin: ORIGIN,
				event_version: EVENT_VERSION,
			} );
		},
		[ recordEvent ]
	);

	// Any new way to open the panel must send this event.
	const trackPanelOpen = useCallback(
		( trigger: 'configure-link' | 'deep-link' ) => {
			recordEvent( 'jetpack_myjetpack_settings_panel_open', {
				feature_slug: module,
				trigger,
				event_version: EVENT_VERSION,
			} );
		},
		[ module, recordEvent ]
	);

	const trackPanelClose = useCallback(
		( method: 'close-button' | 'escape' ) => {
			recordEvent( 'jetpack_myjetpack_settings_panel_close', {
				feature_slug: module,
				method,
				event_version: EVENT_VERSION,
			} );
		},
		[ module, recordEvent ]
	);

	return {
		trackModuleToggle,
		trackSettingToggle,
		trackSettingChange,
		trackClick,
		trackPanelOpen,
		trackPanelClose,
	};
}
