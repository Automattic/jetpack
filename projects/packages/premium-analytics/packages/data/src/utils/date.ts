/**
 * External dependencies
 */
import { type TZDate } from '@date-fns/tz';
import {
	toLocalTZ,
	reportingTimeZone,
	dateToISOStringWithTZ as _toISOWithTZ,
} from '@jetpack-premium-analytics/datetime';

export function localTZDate( value?: number | string | Date, timezone?: string ): TZDate {
	return toLocalTZ( value, timezone ?? reportingTimeZone() );
}

/** TZ-aware Date -> ISO with offset `YYYY-MM-DDTHH:mm:ss.SSSxxx`. */
export function dateToISOStringWithLocalTZ( date: Date ): string {
	return _toISOWithTZ( date, reportingTimeZone() );
}
