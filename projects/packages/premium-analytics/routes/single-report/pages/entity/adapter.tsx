/**
 * Internal dependencies
 */
import { useEntitySummary } from './use-entity-summary';
import type { EntityFieldSummary } from './use-entity-summary';
import type { SingleReportPageRecord } from '../../registry';
import type { HeaderContext, SingleReportAdapter, SingleReportHeaderSlots } from '../adapter';

/**
 * Header slots from the fields the summary already read.
 *
 * @param summary       - The entity summary.
 * @param context       - The title the stage states.
 * @param context.title - The title the stage states.
 * @return The header slots.
 */
function entityHeaderSlots(
	summary: EntityFieldSummary,
	{ title }: HeaderContext
): SingleReportHeaderSlots {
	return {
		title,
		...( summary.imageUrl && { visual: <img src={ summary.imageUrl } alt="" /> } ),
		...( summary.description && { subTitle: summary.description } ),
	};
}

/**
 * The adapter for a record that names a core-data entity and ships no path adapter.
 *
 * @param page - The page record. It has `entity`.
 * @return The adapter.
 */
export function entityAdapter(
	page: SingleReportPageRecord
): SingleReportAdapter< EntityFieldSummary > {
	return {
		useSummary: entityId => useEntitySummary( page.entity!, page.header ?? null, entityId ),
		headerSlots: entityHeaderSlots,
	};
}
