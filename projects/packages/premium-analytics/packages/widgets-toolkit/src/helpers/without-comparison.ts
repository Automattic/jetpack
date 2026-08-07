/**
 * Types
 */
import type { ReportParams } from '@jetpack-premium-analytics/data';

/**
 * Copy report params with the comparison fields removed.
 *
 * `useReport` folds the comparison query's loading and error flags into the
 * primary ones, so a widget that renders no comparison would otherwise wait on,
 * and fail for, data it never shows. Costs nothing: `useReport` already strips
 * these keys from the primary query, so the shared cache entry is unaffected.
 *
 * @param params - The report params to copy.
 * @return The params without comparison fields.
 */
export function withoutComparison< T extends Partial< ReportParams > >( params: T ): T {
	const next = { ...params };

	delete next.comp;
	delete next.compare_from;
	delete next.compare_to;
	delete next.compare_preset;

	return next;
}
