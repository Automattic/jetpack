import { RelatedPostsSettings } from './related-posts';
import { SeoSettings } from './seo';
import type { MyJetpackModule } from '../../types';
import type { ComponentType } from 'react';

export type ModuleSettingsProps = {
	/** The module, whose `options` hold its current values. Save changes through `jetpack/v4/settings`. */
	module: MyJetpackModule;
};

/**
 * Settings components by module slug. A module not listed gets the panel's fallback.
 *
 * Add an entry to give a feature its own options in the panel. Add its slug to `Initializer::SETTINGS_PANEL_MODULES` in PHP too
 * unless another package already points its Configure URL somewhere, as the SEO package does.
 */
export const moduleSettings: Record< string, ComponentType< ModuleSettingsProps > > = {
	'related-posts': RelatedPostsSettings,
	'seo-tools': SeoSettings,
	'verification-tools': SeoSettings,
	sitemaps: SeoSettings,
};
