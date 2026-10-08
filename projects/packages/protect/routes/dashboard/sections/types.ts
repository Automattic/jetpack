import type { ProtectSettingsData } from '../data/use-protect-settings';
import type { ComponentType } from 'react';

export type DashboardContext< S = unknown > = {
	/** This section's state from PHP, or undefined when PHP registered no section by this key. */
	state: S;
	/** Jetpack settings and modules, shared by every Settings card. */
	settings: ProtectSettingsData;
	/** Switches to the Settings tab. */
	openSettings: () => void;
};

export type SectionTab< S = unknown > = {
	value: string;
	label: () => string;
	/** Whether the tab shows, for example only with a paid plan. */
	isAvailable: ( context: DashboardContext< S > ) => boolean;
	Panel: ComponentType< DashboardContext< S > >;
};

/**
 * One feature of the dashboard. Every part is optional, so a section can land one piece at a time.
 */
export type ProtectSection< S = unknown > = {
	key: string;
	OverviewCard?: ComponentType< DashboardContext< S > >;
	SettingsCard?: ComponentType< DashboardContext< S > >;
	tab?: SectionTab< S >;
	/** A sidebar the dashboard shows while `param` is in the URL, such as the threat open in Scan. */
	inspector?: { param: string; Panel: ComponentType };
};
