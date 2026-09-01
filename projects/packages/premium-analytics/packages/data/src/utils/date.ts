/**
 * External dependencies
 */
import { type TZDate } from '@date-fns/tz';
import {
	toLocalTZ,
	siteTimeZone,
	formatToTimezoneNaiveString as _formatNaive,
	dateToISOStringWithTZ as _toISOWithTZ,
} from '@jetpack-premium-analytics/datetime';

export function localTZDate( value?: number | string | Date, timezone?: string ): TZDate {
	const tz = timezone ?? siteTimeZone();
	return toLocalTZ( value, tz );
}

/** TZ-aware Date -> timezone-naive `YYYY-MM-DDTHH:mm:ss.SSS`. */
export function formatToTimezoneNaiveString( date: Date, timezone?: string ): string {
	const tz = timezone ?? siteTimeZone();
	return _formatNaive( date, tz );
}

/** TZ-aware Date -> ISO with offset `YYYY-MM-DDTHH:mm:ss.SSSxxx`. */
export function dateToISOStringWithLocalTZ( date: Date, timezone?: string ): string {
	const tz = timezone ?? siteTimeZone();
	return _toISOWithTZ( date, tz );
}
