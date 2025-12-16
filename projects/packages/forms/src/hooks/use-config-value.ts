import { useSelect } from '@wordpress/data';
import { CONFIG_STORE } from '../store/config/index.ts';
import type { ConfigSelectors } from '../store/config/types.ts';
import type { FormsConfigData } from '../types/index.ts';

/**
 * Hook to get a specific config value from the forms config store.
 * Automatically fetches config from /wp/v2/feedback/config if not already loaded.
 * Config data is cached and won't refetch unless invalidated.
 *
 * @param key - The config key to retrieve
 * @return The config value, or undefined if not yet loaded or if the key doesn't exist
 *
 * @example
 * const isMailPoetEnabled = useConfigValue( 'isMailPoetEnabled' );
 */
export default function useConfigValue< K extends keyof FormsConfigData >(
	key: K
): FormsConfigData[ K ] | undefined {
	return useSelect(
		select => {
			const configSelect = select( CONFIG_STORE ) as ConfigSelectors;
			// Trigger getConfig resolver (which fetches all config data)
			const config = configSelect.getConfig();
			// Return the specific key value
			return config?.[ key ];
		},
		[ key ]
	);
}
