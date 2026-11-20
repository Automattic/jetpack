import { ModuleToggle } from '../module-toggle';
import { useSettingsPanelTracking } from './use-settings-panel-tracking';
import type { ModuleToggleProps } from '../module-toggle';

/**
 * The module switch for the settings panel, which records each switch.
 *
 * @param props - The `ModuleToggle` props.
 * @return The switch.
 */
export function PanelModuleToggle( props: Omit< ModuleToggleProps, 'onSwitch' > ) {
	const { trackModuleToggle } = useSettingsPanelTracking( props.module.module );

	return <ModuleToggle { ...props } onSwitch={ trackModuleToggle } />;
}
