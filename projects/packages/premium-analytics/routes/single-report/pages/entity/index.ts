/**
 * Internal dependencies
 */
import { entityHeaderSlots } from './entity-header-slots';
import { entityHeaderActions } from './header-actions';
import { useEntitySummary } from './use-entity-summary';
import type { SingleReportAdapter } from '../adapter';
import type { EntityRecordSummary } from './use-entity-summary';

/**
 * The page of an entity without an adapter of its own: the record core-data answers, read by
 * the record convention, and the View action.
 */
export const entityAdapter: SingleReportAdapter< EntityRecordSummary > = {
	useSummary: useEntitySummary,
	headerSlots: entityHeaderSlots,
	headerActions: entityHeaderActions,
};
