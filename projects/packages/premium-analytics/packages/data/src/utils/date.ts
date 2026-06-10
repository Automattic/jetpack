/**
 * External dependencies
 */
import { type TZDate } from '@date-fns/tz';
import {
	toLocalTZ,
	formatToTimezoneNaiveString as _formatNaive,
	dateToISOStringWithTZ as _toISOWithTZ,
} from '@jetpack-premium-analytics/datetime';
import { store as coreStore, type Settings } from '@wordpress/core-data';
import { select } from '@wordpress/data';

type FullSettings = Settings & {
	gmt_offset: number;
};

let DEFAULT_TIME_ZONE: string;
try {
	DEFAULT_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '+00:00';
} catch {
	DEFAULT_TIME_ZONE = '+00:00';
}

/**
 * Format the GMT offset to a string.
 *
 * @param {number | undefined} offset - The GMT offset.
 * @return {string} The formatted GMT offset.
 */
function formatGmtOffset( offset: number | undefined ): string {
	if ( ! offset ) {
		return DEFAULT_TIME_ZONE;
	}

	const sign = offset >= 0 ? '+' : '-';
	const abs = Math.abs( offset );
	const hours = Math.floor( abs );
	const minutes = Math.floor( ( abs - hours ) * 60 + 1e-6 );
	return `${ sign }${ String( hours ).padStart( 2, '0' ) }:${ String( minutes ).padStart(
		2,
		'0'
	) }`;
}

/*
 * Get the timezone from the site settings.
 * If the timezone is not set, use the GMT offset.
 * If the GMT offset is not set, use the default timezone.
 *
 * @param {string} timezone - The timezone to use.
 * @return {string} The timezone.
 */
export function getSiteTimezone() {
	const siteSettings = select( coreStore ).getEntityRecord( 'root', 'site' ) as FullSettings;

	if ( ! siteSettings ) {
		return DEFAULT_TIME_ZONE;
	}

	return siteSettings?.timezone?.length
		? siteSettings?.timezone
		: formatGmtOffset( siteSettings?.gmt_offset ) || DEFAULT_TIME_ZONE;
}

/**
 * Returns the site's GMT offset as a string (e.g. "+05:30", "-08:00").
 * If site settings are not loaded, throws an error.
 * @return {string} The site's GMT offset.
 */
export function getSiteGmtOffset(): string {
	const siteSettings = select( coreStore ).getEntityRecord( 'root', 'site' ) as FullSettings;
	if ( ! siteSettings ) {
		throw new Error( 'getSiteGmtOffset() called before core settings are ready' );
	}
	return formatGmtOffset( siteSettings?.gmt_offset ) || DEFAULT_TIME_ZONE;
}

/**
 * Same API and behavior as your current localTZDate:
 * - Accepts number | string | Date (or undefined -> now)
 * - Uses site timezone by default
 * - Returns TZDate (timezone-aware)
 */
export function localTZDate( value?: number | string | Date, timezone?: string ): TZDate {
	const tz = timezone ?? getSiteTimezone();
	return toLocalTZ( value, tz );
}

/**
 * Same semantics as your current helper:
 * TZ-aware -> timezone-naive "YYYY-MM-DDTHH:mm:ss.SSS"
 */
export function formatToTimezoneNaiveString( date: Date, timezone?: string ): string {
	const tz = timezone ?? getSiteTimezone();
	return _formatNaive( date, tz );
}

/**
 * Same semantics as your current helper:
 * TZ-aware -> ISO with offset "YYYY-MM-DDTHH:mm:ss.SSSxxx"
 */
export function dateToISOStringWithLocalTZ( date: Date, timezone?: string ): string {
	const tz = timezone ?? getSiteTimezone();
	return _toISOWithTZ( date, tz );
}
