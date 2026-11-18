/**
 * Internal dependencies
 */
import { authorAdapter } from './author';
import { entityAdapter } from './entity';
import { postAdapter } from './post';
import { videoAdapter } from './video';
import type { SingleReportAdapter } from './adapter';
import type { SingleReportPageRecord } from '../registry';

// The adapters by record `path`.
const ADAPTERS: Record< string, SingleReportAdapter > = {
	author: authorAdapter,
	post: postAdapter,
	video: videoAdapter,
};

/**
 * The adapter of a registered page: the one for its `path`, else the entity adapter for a
 * page bound to an entity, which reads the record by the record convention.
 *
 * @param page - The page record.
 * @return The adapter, or undefined for a page that renders from its record alone.
 */
export function getSingleReportAdapter(
	page: Pick< SingleReportPageRecord, 'path' | 'entity' >
): SingleReportAdapter | undefined {
	if ( Object.prototype.hasOwnProperty.call( ADAPTERS, page.path ) ) {
		return ADAPTERS[ page.path ];
	}

	return page.entity ? entityAdapter : undefined;
}

export type {
	EntitySummary,
	HeaderContext,
	SectionScope,
	SectionState,
	SectionsContext,
	SingleReportAdapter,
	SingleReportHeaderSlots,
} from './adapter';
