/**
 * Report time-series bucket sizes, ordered finest first.
 */
export const INTERVAL_TYPES = [ 'hour', 'day', 'week', 'month', 'quarter', 'year' ] as const;

/**
 * A report time-series bucket size, derived from the runtime tuple so both stay
 * in sync.
 */
export type IntervalType = ( typeof INTERVAL_TYPES )[ number ];

/**
 * Whether a value is a known `IntervalType`.
 *
 * @param value - Untyped candidate.
 * @return Whether `value` is an `IntervalType`.
 */
export function isIntervalType( value: unknown ): value is IntervalType {
	return typeof value === 'string' && ( INTERVAL_TYPES as readonly string[] ).includes( value );
}
