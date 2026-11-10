/**
 * Internal dependencies
 */
import { postAdapter } from './post';
import { videoAdapter } from './video';
import type { SingleReportAdapter } from './adapter';

// The adapters by record `path`; a record without one renders from the record alone.
const ADAPTERS: Record< string, SingleReportAdapter > = {
	post: postAdapter,
	video: videoAdapter,
};

/**
 * The adapter of a registered page, if the route ships one.
 *
 * @param path - The record's `path`.
 * @return The adapter, or undefined.
 */
export function getSingleReportAdapter( path: string ): SingleReportAdapter | undefined {
	return Object.prototype.hasOwnProperty.call( ADAPTERS, path ) ? ADAPTERS[ path ] : undefined;
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
