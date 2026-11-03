import { Stack } from '@wordpress/ui';
import SeoOptInCard from '../seo-opt-in-card';
import { FallbackSettings } from './fallback-settings';
import type { ModuleSettingsProps } from './registry';

/**
 * The SEO modules before the site opts in: the invitation to switch, above the usual panel.
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
