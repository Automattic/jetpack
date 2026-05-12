import { z } from 'zod';
import { useDataSyncEntry } from './use-data-sync-entry';

const premiumFeaturesSchema = z.array( z.string() );

export type PremiumFeatureSlug =
	| 'cornerstone-10-pages'
	| 'cloud-critical-css'
	| 'image-cdn-quality'
	| 'image-cdn-liar'
	| 'page-cache'
	| ( string & {} );

/**
 * Reads the array of premium feature slugs available to this Boost
 * install. Use `usePremiumFeatures().has( slug )` to test for a
 * specific feature without reaching into the raw array.
 *
 * Slugs in active use across the modernized Settings tab:
 * - `cornerstone-10-pages` — Cornerstone Pages 10-URL plan
 * - `cloud-critical-css`   — Cloud CSS auto-mode
 * - `image-cdn-quality`    — Image CDN quality sliders
 * - `image-cdn-liar`       — Image CDN auto-resize lazy images
 *
 * @return Snapshot of the premium feature set + a `has()` helper.
 */
export function usePremiumFeatures(): {
	isLoading: boolean;
	features: string[];
	has: ( slug: PremiumFeatureSlug ) => boolean;
} {
	const [ query ] = useDataSyncEntry( 'premium_features', premiumFeaturesSchema, {
		staleTime: 60 * 60 * 1000,
	} );
	const features = query.data ?? [];
	return {
		isLoading: query.isLoading,
		features,
		has: slug => features.includes( slug ),
	};
}
