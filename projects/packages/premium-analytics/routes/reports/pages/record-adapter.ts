/**
 * Internal dependencies
 */
import { READY_SUMMARY } from '../../single-report/components';
import type { SingleReportAdapter } from '../../single-report/pages';

/**
 * What a reports page needs when its record says it all: no entity to wait on, and the open
 * section heading it, else its own label.
 */
export const recordAdapter: SingleReportAdapter = {
	useSummary: () => READY_SUMMARY,
	headerSlots: ( summary, { label, section } ) => ( {
		title: section?.label ?? section?.section.label ?? label,
	} ),
};
