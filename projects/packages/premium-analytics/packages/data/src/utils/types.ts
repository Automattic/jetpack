/**
 * Utility type to override properties of a type.
 * Useful for transforming API responses where some properties change type.
 *
 * @example
 * type Raw = { count: string; name: string; }
 * type Processed = Override< Raw, { count: number } >
 * // Result: { count: number; name: string; }
 */
export type Override< T, U > = Omit< T, keyof U > & U;

/**
 * Date type parameter for filtering reports by different date fields.
 * - 'created': Filter by order creation date (date_created_gmt)
 * - 'paid': Filter by order payment date (date_paid_gmt)
 * - 'completed': Filter by order completion date (date_completed_gmt)
 */
export type DateType = 'created' | 'paid' | 'completed';

/**
 * Base parameters required by all report endpoints.
 * These three parameters are common across all analytics reports.
 */
export type BaseReportParams = {
	from: string;
	to: string;
	interval: string;
	date_type?: DateType;
};
