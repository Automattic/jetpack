/**
 * External dependencies
 */
import { reportingTimeZone, startOfDayTZ } from '@jetpack-premium-analytics/datetime';
import { useSyncExternalStore } from 'react';

const CHECK_EVERY_MS = 60 * 1000;

const listeners = new Set< () => void >();
let timer: ReturnType< typeof setInterval > | undefined;
let day = 0;

/**
 * The start of the site's current day, as a timestamp.
 *
 * @return The day's start.
 */
function siteDayStart(): number {
	return startOfDayTZ( Date.now(), reportingTimeZone() ).getTime();
}

/**
 * Subscribe to day changes; one timer serves every subscriber.
 *
 * @param listener - Called when the site's day changes.
 * @return The unsubscribe function.
 */
function subscribe( listener: () => void ): () => void {
	listeners.add( listener );

	if ( ! timer ) {
		day = siteDayStart();
		// Polled rather than timed to midnight: DST days are not 24 hours long.
		timer = setInterval( () => {
			const next = siteDayStart();
			if ( next !== day ) {
				day = next;
				listeners.forEach( notify => notify() );
			}
		}, CHECK_EVERY_MS );
	}

	return () => {
		listeners.delete( listener );
		if ( listeners.size === 0 ) {
			clearInterval( timer );
			timer = undefined;
		}
	};
}

/**
 * The cached day while subscribed, else computed: the cache is stale once nobody polls it.
 *
 * @return The day's start, as a timestamp.
 */
function getSnapshot(): number {
	return timer ? day : siteDayStart();
}

/**
 * The start of the site's current day, which changes when the site's midnight passes.
 *
 * Add it to the dependencies of anything that reads a preset's window, so a tab left open past
 * midnight moves to the new day. Reference it in the callback (`void siteDay`), or
 * `react-hooks/exhaustive-deps` flags it as unnecessary.
 *
 * @return The day's start, as a timestamp.
 */
export function useSiteDay(): number {
	return useSyncExternalStore( subscribe, getSnapshot );
}
