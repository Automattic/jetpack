/**
 * External dependencies
 */
import { store as coreStore, type Settings } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Read the site URL from the core site settings — the same entity the route
 * guards already resolve via `ensureCoreSettingsReady()`, so the record is
 * warm by the time report pages render. Callers must handle the undefined
 * fallback: the settings read requires `manage_options`.
 *
 * @return The site URL, or undefined while settings are unavailable.
 */
export function useSiteHomeUrl(): string | undefined {
	return useSelect( select => {
		const settings = select( coreStore ).getEntityRecord( 'root', 'site' ) as Settings | undefined;

		return settings?.url || undefined;
	}, [] );
}
