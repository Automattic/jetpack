/**
 * Internal dependencies
 */
import type { ReportParams } from './search';

/**
 * Only the fields this drops are constrained: report params come in both the
 * normalizer's input and output shapes, which disagree on `preset`, and neither
 * disagreement is this function's business.
 */
type ComparisonFields = Pick<
	ReportParams,
	'comp' | 'compare_from' | 'compare_to' | 'compare_preset'
>;

/**
 * Copy params without comparison fields so a surface can preserve the URL
 * state without fetching or rendering a comparison it does not offer.
 *
 * @param params - The params to copy.
 * @return The params without comparison fields.
 */
export function withoutComparison< T extends Partial< ComparisonFields > >( params: T ): T {
	const next = { ...params };

	delete next.comp;
	delete next.compare_from;
	delete next.compare_to;
	delete next.compare_preset;

	return next;
}
