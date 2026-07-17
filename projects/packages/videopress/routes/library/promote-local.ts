import { __, sprintf } from '@wordpress/i18n';

export type PromoteLocalDeps = {
	/**
	 * Fires the promote mutation. Must be a promise that always settles
	 * (mutateAsync) — TanStack detaches the observer from an in-flight
	 * mutation when the same hook instance starts another one, silently
	 * dropping that call's mutate-level callbacks (see useDeleteVideo), so
	 * concurrent promotes can only be sequenced reliably via promises.
	 */
	promote: ( variables: {
		id: string;
		onProgress?: ( percent: number ) => void;
	} ) => Promise< unknown >;
	createSuccessNotice: ( content: string ) => void;
	createErrorNotice: ( content: string ) => void;
	/**
	 * Receives a fresh snapshot of the in-flight id → upload-percent map
	 * whenever it changes (a promote starting, a chunk progress report, or
	 * a promote settling).
	 */
	onPromotingChange: ( progress: Map< string, number > ) => void;
};

/**
 * Build the library's promote-local handler. The factory owns the in-flight
 * progress map (the snapshots pushed through `onPromotingChange` drive the
 * row overlays and their percentages) so a re-entrant call for an id already
 * being promoted is a no-op — the promote endpoints aren't idempotent under
 * concurrency, and without the guard a second same-id promote's `.finally()`
 * would also tear the shared overlay down while the first is still in
 * flight. Chunk progress from the off-Simple walker is folded into the same
 * map; the Simple one-shot promote never reports progress, so its rows stay
 * at 0 until the mutation settles.
 *
 * Extracted from the library stage (mirroring `upload-drop.ts`) so the
 * notice/overlay sequencing is unit-testable without rendering the stage.
 * Create it once per stage instance — the in-flight state lives in this
 * closure, so a fresh factory would forget which rows are mid-promote.
 *
 * @param deps - The mutation trigger, notice creators, and overlay sink.
 * @return The `promoteLocal( id )` handler handed to actions and thumbnails.
 */
export function createPromoteLocal( deps: PromoteLocalDeps ): ( id: string ) => void {
	const inFlight = new Map< string, number >();
	const publish = () => deps.onPromotingChange( new Map( inFlight ) );

	return ( id: string ) => {
		if ( inFlight.has( id ) ) {
			return;
		}
		inFlight.set( id, 0 );
		publish();

		deps
			.promote( {
				id,
				onProgress: ( percent: number ) => {
					// Ignore a straggler progress report after settle.
					if ( ! inFlight.has( id ) ) {
						return;
					}
					inFlight.set( id, percent );
					publish();
				},
			} )
			.then( () => {
				deps.createSuccessNotice( __( 'Video uploaded to VideoPress.', 'jetpack-videopress-pkg' ) );
			} )
			.catch( ( error: Error ) => {
				const reason = error?.message?.trim();
				deps.createErrorNotice(
					reason
						? sprintf(
								/* translators: %s: reason returned by the upload endpoint, e.g. "403: Invalid Mime". */
								__( 'Failed to upload video to VideoPress: %s', 'jetpack-videopress-pkg' ),
								reason
						  )
						: __( 'Failed to upload video to VideoPress.', 'jetpack-videopress-pkg' )
				);
			} )
			.finally( () => {
				inFlight.delete( id );
				publish();
			} );
	};
}
