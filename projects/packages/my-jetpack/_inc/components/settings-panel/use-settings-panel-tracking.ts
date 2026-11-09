import { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';

// The old Settings screen's event names, so its baseline carries over; `origin` tells the panel apart.
const ORIGIN = 'my-jetpack-settings-panel';

const toggled = ( active: boolean ) => ( active ? 'on' : 'off' );

/**
 * Records a module's switches in the panel under the old Settings screen's events.
 *
 * @param module - The module slug.
 * @return Functions to call with the asked-for value as each save starts.
 */
export function useSettingsPanelTracking( module: string ) {
	const { recordEvent } = useAnalytics();

	const trackModuleToggle = useCallback(
		( active: boolean ) => {
			recordEvent( 'jetpack_wpa_module_toggle', {
				module,
				toggled: toggled( active ),
				origin: ORIGIN,
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
			} );
		},
		[ module, recordEvent ]
	);

	return { trackModuleToggle, trackSettingToggle };
}
