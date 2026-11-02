import type { MyJetpackModule } from '../../types';
import type { ComponentType } from 'react';

export type ModuleSettingsProps = {
	/** The module, whose `options` hold its current values. Save changes through `jetpack/v4/settings`. */
	module: MyJetpackModule;
};

/**
 * Settings components by module slug. A module not listed gets the panel's fallback.
 *
 * Add an entry to give a feature its own options in the panel.
 */
export const moduleSettings: Record< string, ComponentType< ModuleSettingsProps > > = {};
