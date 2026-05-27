/**
 * DataViews actions for the Activity log.
 *
 * Two comment-specific row + bulk actions: "Not spam" and "Delete
 * permanently". Both check `allowMutations()` and short-circuit with a
 * snackbar notice when the constant is off (preview mode). This is the
 * UX guardrail described in GUARDRAILS.md §"Mutation gate" — not a
 * security boundary (core's own moderation UI is one URL away for any
 * user with `moderate_comments`), but a tripwire against accidental
 * clicks during preview demos.
 */
import { useMutation } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { allowMutations } from '@/lib/is-jetpack-active';
import { showPreviewModeNotice } from './use-toast';
import type { ActivityRow } from './activity-types';
import type { Action } from '@wordpress/dataviews';

type Invalidate = () => void;

/**
 * True if a row is a Comments-row that has a real comment id behind it.
 *
 * @param row - The ActivityRow under consideration.
 * @return True iff the row's subject is a comment AND context carries a
 *         numeric comment id.
 */
function isComment( row: ActivityRow ): boolean {
	return row.subject.kind === 'comment' && Number.isInteger( row.context.comment_id as number );
}

/**
 * Pluck the comment ids out of a selection of rows.
 *
 * @param rows - DataViews selection.
 * @return Array of integer comment ids.
 */
function commentIds( rows: ActivityRow[] ): number[] {
	return rows.filter( isComment ).map( r => r.context.comment_id as number );
}

/**
 * Build the action list for `<DataViews>`. Pass `invalidate` so each
 * mutation can ask the parent to refetch the list after the action
 * resolves.
 *
 * @param invalidate - Called after a successful mutation.
 * @return Array of `Action<ActivityRow>` for the DataViews `actions` prop.
 */
export function useActions( invalidate: Invalidate ): Action< ActivityRow >[] {
	const markAsHam = useMutation( {
		mutationFn: ( ids: number[] ) =>
			Promise.all(
				ids.map( id =>
					apiFetch( {
						path: `/wp/v2/comments/${ id }`,
						method: 'POST',
						data: { status: 'approve' },
					} )
				)
			),
		onSuccess: invalidate,
	} );

	const deletePermanently = useMutation( {
		mutationFn: ( ids: number[] ) =>
			Promise.all(
				ids.map( id =>
					apiFetch( {
						path: `/wp/v2/comments/${ id }?force=true`,
						method: 'DELETE',
					} )
				)
			),
		onSuccess: invalidate,
	} );

	return [
		{
			id: 'mark-as-ham',
			label: __( 'Not spam', 'akismet' ),
			supportsBulk: true,
			isEligible: isComment,
			callback: items => {
				if ( ! allowMutations() ) {
					showPreviewModeNotice( __( 'Not spam', 'akismet' ) );
					return;
				}
				const ids = commentIds( items );
				if ( ids.length === 0 ) {
					return;
				}
				markAsHam.mutate( ids );
			},
		},
		{
			id: 'delete-permanently',
			label: __( 'Delete permanently', 'akismet' ),
			supportsBulk: true,
			isEligible: isComment,
			callback: items => {
				if ( ! allowMutations() ) {
					showPreviewModeNotice( __( 'Delete permanently', 'akismet' ) );
					return;
				}
				const ids = commentIds( items );
				if ( ids.length === 0 ) {
					return;
				}
				deletePermanently.mutate( ids );
			},
		},
	];
}
