/**
 * External dependencies
 */
import { safeHttpUrl, type LeaderboardRowInput } from '@jetpack-premium-analytics/widgets-toolkit';
import type { StatsTopAiUrl } from '@jetpack-premium-analytics/data';

/**
 * Where a requested URL opens: itself when the logs kept it whole, else its path on the site.
 *
 * @param url     - The URL as the edge logs keep it.
 * @param homeUrl - The site's address, when known.
 * @return The address, or undefined when there is none safe to link.
 */
function pageHref( url: string, homeUrl?: string ): string | undefined {
	const absolute = safeHttpUrl( url );
	if ( absolute ) {
		return absolute;
	}
	if ( ! homeUrl || ! safeHttpUrl( url, { allowRelative: true } ) ) {
		return undefined;
	}
	try {
		return new URL( url, homeUrl ).href;
	} catch {
		return undefined;
	}
}

/** A path as a reader would type it; the logs keep it percent-encoded. */
function pageLabel( url: string ): string {
	try {
		return decodeURI( url );
	} catch {
		return url;
	}
}

/**
 * The rows of the Top pages by AI bot requests list.
 *
 * @param urls    - The requested URLs, most requests first.
 * @param homeUrl - The site's address, for the URLs logged as paths.
 * @return One row per URL, linking to the page where it can.
 */
export function buildPageRows(
	urls: readonly StatsTopAiUrl[],
	homeUrl?: string
): LeaderboardRowInput[] {
	return urls.map( ( { url, requests } ) => {
		const href = pageHref( url, homeUrl );

		return {
			id: url,
			label: pageLabel( url ),
			value: requests,
			...( href ? { action: { kind: 'link' as const, href } } : {} ),
		};
	} );
}
