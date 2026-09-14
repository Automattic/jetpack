/**
 * Internal dependencies
 */
import { getItemId } from '../../src/dashboard/inbox/utils.js';
/**
 * Types
 */
import type { FormResponse } from '../../src/types/index.ts';

/**
 * Choose which cached copy of a response the page should render.
 *
 * The single response page fetches its own record under `include:[id]`, a cache
 * key the responses list never populates. Waiting for that request before showing
 * anything is what made opening a response feel slow, even though the list the
 * reader clicked from already had the record in the store under its own query.
 *
 * So the page's own record wins when present, and the list's copy stands in until
 * it arrives. Both are fetched `fields_format=collection`, so the hand-over
 * changes no shape and nothing re-renders differently when the authoritative
 * record lands.
 *
 * The list's copy can be stale — a response deleted from under the reader keeps
 * rendering until this page's own request 404s. That is the trade: the
 * authoritative record always wins once it arrives, and showing the row the reader
 * just clicked beats showing them a spinner.
 *
 * @param ownRecords  - Records for this page's `include:[id]` query.
 * @param listRecords - Records for the pinned list query, if loaded.
 * @param id          - The response ID from the route.
 * @return The record to render, or undefined when neither source has it.
 */
export default function pickResponseRecord(
	ownRecords: FormResponse[] | null | undefined,
	listRecords: FormResponse[] | null | undefined,
	id: number
): FormResponse | undefined {
	return ownRecords?.[ 0 ] ?? listRecords?.find( item => Number( getItemId( item ) ) === id );
}
