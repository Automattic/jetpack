/**
 * Internal dependencies
 */
import { publishedSentence } from '../../detail-header';
import { detailHeaderSlots } from '../../detail-header-slots';
import type { EntityRecordSummary } from './use-entity-summary';
import type { HeaderContext, SingleReportHeaderSlots } from '../adapter';

/**
 * The header of an entity read by the record convention: its featured image, its title, and
 * one line stating its kind, its publish date and the applied performance window.
 *
 * @param summary     - The entity summary, in any state.
 * @param context     - The page's label, the title it states and the window it reports over.
 * @param failedTitle - The title of a missing or failed entity, for a page that words it; absent, the title the page states.
 * @return The header slots for this entity.
 */
export function entityHeaderSlots(
	summary: EntityRecordSummary,
	context: HeaderContext,
	failedTitle?: string
): SingleReportHeaderSlots {
	return detailHeaderSlots( summary, {
		// Without an image the page's icon stands in.
		visual: summary.imageUrl ? (
			<img src={ summary.imageUrl } alt="" data-testid="entity-summary-image" />
		) : undefined,
		title: context.title,
		sentence: publishedSentence( context.label, summary.publishedDate ),
		performanceRange: context.performanceRange,
		failedTitle,
	} );
}
