/**
 * External dependencies
 */
import type { normalizeReportParams } from '@jetpack-premium-analytics/data';

/**
 * Inferred types
 */
type ReportParams = NonNullable< Parameters< typeof normalizeReportParams >[ 0 ] >;

/**
 * The report params a widget carries as an attribute.
 *
 * The editor that writes them lives in `@jetpack-premium-analytics/fields`
 * (`createReportParamsField`); only the attribute shape belongs here, because
 * `WidgetRoot` and every widget's `render.tsx` read it.
 */
export type ReportParamsFieldAttributes = {
	reportParams: ReportParams;
};
