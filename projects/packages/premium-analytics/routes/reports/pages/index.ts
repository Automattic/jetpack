/**
 * Internal dependencies
 */
import { postsAdapter } from './posts';
import { recordAdapter } from './record-adapter';
import type { SingleReportAdapter } from '../../single-report/pages';
import type { ReportPageRecord } from '../../single-report/registry';

// The adapters by record `path`.
const ADAPTERS: Record< string, SingleReportAdapter > = {
	posts: postsAdapter,
};

/**
 * The adapter of a registered reports page: the one for its `path`, else the record's own.
 *
 * @param page - The page record.
 * @return The adapter.
 */
export function getReportsPageAdapter(
	page: Pick< ReportPageRecord, 'path' >
): SingleReportAdapter {
	return Object.prototype.hasOwnProperty.call( ADAPTERS, page.path )
		? ADAPTERS[ page.path ]
		: recordAdapter;
}
