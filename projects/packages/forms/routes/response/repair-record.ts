/**
 * Types
 */
import type { DispatchActions } from '../../src/dashboard/inbox/stage/types.tsx';
import type { FormResponse } from '../../src/types/index.ts';

/**
 * Re-receive a response record carrying the status it was just given.
 *
 * Needed by every status change made from the standalone single response page,
 * because that page keeps the user in place instead of navigating away. It
 * repairs two different ways the store would otherwise misrepresent the response
 * the user is still looking at.
 *
 * Trash goes through `deleteEntityRecord`, whose `REMOVE_ITEMS` reducer drops the
 * record from core-data entirely, leaving the page on its "not found" state.
 *
 * The save-based changes (spam / not spam / restore, including the one behind the
 * email's "Mark as spam" confirmation) PUT without `fields_format`, and the
 * endpoint defaults that to `label-value` (see `class-contact-form-endpoint.php`).
 * core-data receives that response into the store, replacing the
 * collection-shaped `fields` this page renders from, so the body would visibly
 * flatten into plain rows.
 *
 * Pass the *pre-action* record, which still holds the rich collection-shaped
 * fields, and only once the server has accepted the change.
 *
 * The page's collection query is passed through so the record is restored to that
 * query's `itemIds` as well as to the item map — trashing dispatches `REMOVE_ITEMS`,
 * which strips the id from both.
 *
 * @param receiveEntityRecords - core-data's `receiveEntityRecords` dispatcher.
 * @param response             - The response as it was before the action ran.
 * @param nextStatus           - The status the server just accepted.
 * @param query                - The query the page reads the response through.
 */
export default function repairResponseRecord(
	receiveEntityRecords: DispatchActions[ 'receiveEntityRecords' ],
	response: FormResponse,
	nextStatus: FormResponse[ 'status' ],
	query: object
): void {
	receiveEntityRecords(
		'postType',
		'feedback',
		[ { ...response, status: nextStatus } ],
		query as never,
		true
	);
}
