import type { ProtectSettingsData } from '../data/use-protect-settings';
import type { ComponentType } from 'react';

export type DashboardContext = {
	/** This section's state from PHP, or undefined when PHP registered no section by this key. */
	state: unknown;
	/** Jetpack settings and modules, shared by every Settings card. */
	settings: ProtectSettingsData;
	/** Switches to the Settings tab. */
	openSettings: () => void;
};

export type SectionTab = {
	value: string;
	label: () => string;
	/** Whether the tab shows, for example only with a paid plan. */
	isAvailable: ( context: DashboardContext ) => boolean;
	Panel: ComponentType< DashboardContext >;
};

/**
 * One feature of the dashboard. Every part is optional, so a section can land one piece at a time.
 */
export type ProtectSection = {
	key: string;
	OverviewCard?: ComponentType< DashboardContext >;
	SettingsCard?: ComponentType< DashboardContext >;
	tab?: SectionTab;
};
