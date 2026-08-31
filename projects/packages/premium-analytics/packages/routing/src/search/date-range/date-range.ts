/**
 * External dependencies
 */
import { localTZDate, dateToISOStringWithLocalTZ } from '@jetpack-premium-analytics/data';
import { isValid } from 'date-fns';
import type { DateRange } from '@jetpack-premium-analytics/datetime';

/**
 * Parse a stored report-param date for the picker.
 *
 * @param value    - The stored `from` or `to`.
 * @param timezone - The timezone used by the picker.
 * @return The parsed date, or undefined when it is missing or malformed.
 */
export function decodeDateSearchParam( value?: string, timezone?: string ): Date | undefined {
	if ( ! value ) {
		return undefined;
	}

	const date = localTZDate( value, timezone );

	return isValid( date ) ? date : undefined;
}

/**
 * Serialize a Date into an ISO string with the site's timezone, for writing
 * to the URL or API requests.
 */
export function encodeDateToSearchParam( date?: Date, timezone?: string ): string | undefined {
	return date ? dateToISOStringWithLocalTZ( localTZDate( date, timezone ) ) : undefined;
}

type WriteDateRangeToSearchProps = {
	navigate: ( opts: {
		to: string;
		search:
			| Record< string, string | undefined >
			| ( ( prev: Record< string, string | undefined > ) => Record< string, string | undefined > );
	} ) => void;
	to: string;
	range: DateRange;
	timezone?: string;
	search?: Record< string, string | undefined | null >;
};

/**
 * Write a DateRange to the URL, converting each end to ISO+offset in the
 * site's timezone. Pass `interval` or other params via `search` to keep them
 * alongside `from`/`to`.
 */
export function writeDateRangeToSearch( {
	navigate,
	to: toPath,
	range,
	timezone,
	search,
}: WriteDateRangeToSearchProps ) {
	const fromParam = encodeDateToSearchParam( range?.from, timezone );
	const toParam = encodeDateToSearchParam( range?.to, timezone );

	navigate( {
		to: toPath,
		search: ( prev: Record< string, string | undefined > ) => ( {
			...prev,
			from: fromParam,
			to: toParam,
			...search,
		} ),
	} );
}

type WriteComparisonToSearchProps = {
	navigate: ( opts: {
		to: string;
		search:
			| Record< string, string | undefined >
			| ( ( prev: Record< string, string | undefined > ) => Record< string, string | undefined > );
	} ) => void;
	to: string;
	range?: DateRange;
	presetId?: string;
	enabled?: boolean;
	timezone?: string;
	search?: Record< string, string | undefined | null >;
};

export function writeComparisonToSearch( {
	navigate,
	to: toPath,
	range,
	presetId,
	enabled,
	timezone,
	search,
}: WriteComparisonToSearchProps ) {
	const fromParam = encodeDateToSearchParam( range?.from, timezone );
	const toParam = encodeDateToSearchParam( range?.to, timezone );

	navigate( {
		to: toPath,
		search: ( prev: Record< string, string | undefined > ) => ( {
			...prev,
			compare_from: fromParam,
			compare_to: toParam,
			compare_preset: presetId ?? undefined,
			comp: enabled ? '1' : undefined,
			...search,
		} ),
	} );
}
