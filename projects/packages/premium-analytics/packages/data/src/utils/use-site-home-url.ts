/**
 * External dependencies
 */
import { store as coreStore, type Settings } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Read the site URL from the core site settings, which the route guards start loading via
 * `ensureCoreSettingsReady()`. Callers must handle undefined: the record may still be loading,
 * and the settings read requires `manage_options`.
 */
export function useSiteHomeUrl(): string | undefined {
	return useSelect( select => {
		const settings = select( coreStore ).getEntityRecord( 'root', 'site' ) as Settings | undefined;

		return settings?.url || undefined;
	}, [] );
}
