import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';

const allowedSuggestions = [
	'1',
	'page_saved',
	'post_saved',
	'switched_theme',
	'plugin_change',
] as const;

export type RegenerationReason = ( typeof allowedSuggestions )[ number ];

/**
 * Hook to get the reason why (if any) we should recommend users regenerate their Critical CSS.
 */
export function useRegenerationReason(): [ RegenerationReason | null, () => void ] {
	const [ { data }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'critical_css_suggest_regenerate',
		z.enum( allowedSuggestions ).nullable()
	);

	function reset() {
		mutate( null );
	}

	return [ data || null, reset ];
}
