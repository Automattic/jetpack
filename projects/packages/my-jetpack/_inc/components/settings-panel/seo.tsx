import { Stack } from '@wordpress/ui';
import SeoOptInCard from '../seo-opt-in-card';
import { FallbackSettings } from './fallback-settings';
import type { ModuleSettingsProps } from './registry';

/**
 * The SEO modules while the site has not moved to the SEO dashboard: the invitation to, above the usual panel.
 *
 * An opted-in site never gets here from Configure, because the SEO package then points the module at its own page.
 *
 * @param props        - Component props.
 * @param props.module - The module.
 * @return The settings.
 */
export function SeoSettings( { module: $module }: ModuleSettingsProps ) {
	return (
		<Stack direction="column" gap="lg">
			<SeoOptInCard />
			<FallbackSettings module={ $module } />
		</Stack>
	);
}
