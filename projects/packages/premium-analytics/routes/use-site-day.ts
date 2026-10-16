/**
 * External dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import {
	computePrimaryRange,
	PRESET_TODAY,
	reportingTimeZone,
} from '@jetpack-premium-analytics/datetime';

const CHECK_EVERY_MS = 60 * 1000;

/**
 * The start of the site's current day, as a timestamp.
 *
 * @return The day's start.
 */
function siteDayStart(): number {
	return computePrimaryRange( PRESET_TODAY, reportingTimeZone() )?.from.getTime() ?? 0;
}

/**
 * The start of the site's current day, which changes when the site's midnight passes.
 *
 * @return The day's start, as a timestamp.
 */
export function useSiteDay(): number {
	const [ day, setDay ] = useState( siteDayStart );

	useEffect( () => {
		// Polled rather than timed to midnight: DST days are not 24 hours long.
		const timer = setInterval( () => setDay( siteDayStart() ), CHECK_EVERY_MS );
		return () => clearInterval( timer );
	}, [] );

	return day;
}
