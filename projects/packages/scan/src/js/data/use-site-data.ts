import { useMemo } from 'react';
import type { JetpackScanInitialState } from './types';

declare global {
	interface Window {
		JPSCAN_INITIAL_STATE?: JetpackScanInitialState;
	}
}

/**
 * Convert a WordPress locale (e.g. `en_US`) into a BCP 47 language tag
 * (e.g. `en-US`) that `Intl.*` APIs accept. WordPress uses underscores;
 * passing `en_US` to `Intl.DateTimeFormat` throws `RangeError: Invalid
 * language tag`.
 *
 * @param wpLocale - WordPress-style locale string.
 * @return BCP 47 language tag.
 */
const toBcp47Locale = ( wpLocale: string ): string => wpLocale.replace( /_/g, '-' );

/**
 * Read the site bootstrap that PHP renders into the page. Returns a stable
 * reference via `useMemo` so it's safe to pass into query keys and effect
 * dependency arrays.
 *
 * @return The hydrated site-data fields.
 */
export function useSiteData(): JetpackScanInitialState[ 'siteData' ] {
	return useMemo( () => {
		const data = window.JPSCAN_INITIAL_STATE?.siteData;
		return {
			id: Number( data?.id ?? 0 ),
			title: String( data?.title ?? '' ),
			adminUrl: String( data?.adminUrl ?? '' ),
			slug: String( data?.slug ?? '' ),
			gmtOffset: Number( data?.gmtOffset ?? 0 ),
			timezoneString: String( data?.timezoneString ?? '' ),
			locale: toBcp47Locale( String( data?.locale ?? 'en' ) ),
		};
	}, [] );
}
