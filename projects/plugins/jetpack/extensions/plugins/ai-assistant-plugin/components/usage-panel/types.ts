export const USAGE_PANEL_PLACEMENT_JETPACK_SIDEBAR = 'jetpack_sidebar';
export const USAGE_PANEL_PLACEMENT_BLOCK_SETTINGS_SIDEBAR = 'block_settings_sidebar';

/*
 * Props for the usage panel component.
 */
export type UsagePanelProps = {
	placement?:
		| typeof USAGE_PANEL_PLACEMENT_JETPACK_SIDEBAR
		| typeof USAGE_PANEL_PLACEMENT_BLOCK_SETTINGS_SIDEBAR;
};
