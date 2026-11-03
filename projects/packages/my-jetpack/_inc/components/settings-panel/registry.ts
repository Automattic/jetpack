import { RelatedPostsSettings } from './related-posts';
import { SeoSettings } from './seo';
import type { MyJetpackModule } from '../../types';
import type { ComponentType } from 'react';

export type ModuleSettingsProps = {
	/** The module, whose `options` hold its current values. Save changes through `jetpack/v4/settings`. */
	module: MyJetpackModule;
	/** True when the site cannot use the module, as in offline mode. Lock every control; the panel says why. */
	disabled: boolean;
};

/**
 * Settings components by module slug. A module not listed gets the panel's fallback.
 *
 * Add an entry to give a feature its own options in the panel. Also add its slug to `Initializer::SETTINGS_PANEL_MODULES` in PHP,
 * unless the Configure link already reaches the panel in JS, as it does for the SEO modules.
 */
export const moduleSettings: Record< string, ComponentType< ModuleSettingsProps > > = {
	'related-posts': RelatedPostsSettings,
	'seo-tools': SeoSettings,
	'verification-tools': SeoSettings,
};
