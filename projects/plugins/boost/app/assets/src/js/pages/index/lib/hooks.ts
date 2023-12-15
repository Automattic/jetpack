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

export const useSuggestRegenerate = () =>
	useDataSync(
		'jetpack_boost_ds',
		'critical_css_suggest_regenerate',
		z.enum( allowedSuggestions ).nullable()
	);

export const usePremiumFeatures = () => {
	const [ { data: premiumFeatures } ] = useDataSync(
		'jetpack_boost_ds',
		'premium_features',
		z.array( z.string() )
	);

	return premiumFeatures;
};
