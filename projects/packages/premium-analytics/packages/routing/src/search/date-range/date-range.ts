/**
 * External dependencies
 */
import { localTZDate, dateToISOStringWithLocalTZ } from '@jetpack-premium-analytics/data';
import type { DateRange } from '@jetpack-premium-analytics/datetime';

/**
 * Serializes a Date into an ISO string with the site's timezone
 * (or returns an empty string if no date is provided).
 * Useful for writing dates to the URL and for API requests.
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
 * Writes a DateRange to the URL using navigate().
 *
 * - Centralizes the conversion from Date -> ISO(+offset) according to
 *   the site's timezone.
 * - If you need to preserve/propagate `interval` or other params,
 *   pass them in `search`.
 * - Note: whether other existing params are preserved depends on the
 *   router's navigate implementation. This helper sets an explicit object.
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
