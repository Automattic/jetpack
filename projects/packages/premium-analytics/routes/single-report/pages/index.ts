/**
 * Internal dependencies
 */
import { authorAdapter } from './author';
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
 * The adapter of a registered page: the one for its `path`, else the post adapter for a
 * post type's page, which reads the type from the Stats record.
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

	return page.entity?.kind === 'postType' ? ADAPTERS.post : undefined;
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
