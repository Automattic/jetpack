// Reading and updating the per-group blocked-crawler value (see `Ai_Crawlers::OPTION`).
import type { AiCrawler, BlockedCrawlers } from './geo-types';

/**
 * Whether the owner blocked a crawler.
 *
 * @param blocked - The blocked crawlers, per group.
 * @param crawler - The crawler to check.
 * @return Whether it is blocked.
 */
export const isCrawlerBlocked = ( blocked: BlockedCrawlers, crawler: AiCrawler ): boolean => {
	const group = blocked[ crawler.type ];
	return group === 'all' || ( Array.isArray( group ) && group.includes( crawler.slug ) );
};

/**
 * The blocked crawlers after one crawler is blocked or allowed. A group whose every
 * crawler ends up blocked is saved as `'all'`, which also covers crawlers added later.
 *
 * @param blocked   - The blocked crawlers, per group.
 * @param catalog   - The full crawler catalog.
 * @param slug      - The crawler to change.
 * @param isBlocked - Whether to block it.
 * @return The new blocked crawlers.
 */
export const withCrawlerBlocked = (
	blocked: BlockedCrawlers,
	catalog: AiCrawler[],
	slug: string,
	isBlocked: boolean
): BlockedCrawlers => {
	const crawler = catalog.find( bot => bot.slug === slug );
	if ( ! crawler ) {
		return blocked;
	}
	const group = catalog.filter( bot => bot.type === crawler.type );
	const next = group
		.filter( bot => ( bot.slug === slug ? isBlocked : isCrawlerBlocked( blocked, bot ) ) )
		.map( bot => bot.slug );
	return { ...blocked, [ crawler.type ]: next.length === group.length ? 'all' : next };
};

/**
 * The blocked crawlers after a whole group is blocked or allowed.
 *
 * @param blocked   - The blocked crawlers, per group.
 * @param type      - The group to change.
 * @param isBlocked - Whether to block it.
 * @return The new blocked crawlers.
 */
export const withGroupBlocked = (
	blocked: BlockedCrawlers,
	type: AiCrawler[ 'type' ],
	isBlocked: boolean
): BlockedCrawlers => ( { ...blocked, [ type ]: isBlocked ? 'all' : [] } );
