/**
 * Internal dependencies
 */
import type { ReportParams } from './search';

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
/**
 * Only the fields this drops are constrained: report params come in both the
 * normalizer's input and output shapes, which disagree on `preset`, and neither
 * disagreement is this function's business.
 */
type ComparisonFields = Pick<
	ReportParams,
	'comp' | 'compare_from' | 'compare_to' | 'compare_preset'
>;

export function withoutComparison< T extends Partial< ComparisonFields > >( params: T ): T {
	const next = { ...params };

	delete next.comp;
	delete next.compare_from;
	delete next.compare_to;
	delete next.compare_preset;

	return next;
}
