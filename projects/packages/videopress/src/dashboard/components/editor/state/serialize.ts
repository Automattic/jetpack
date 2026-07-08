/**
 * Conversion between an {@link EditSession} and the serialized operations
 * list exchanged with the server.
 *
 * The canonical serialized form is: at most one trim operation first (omitted
 * entirely when it spans the full master), followed by the cuts sorted by
 * start. All values are integer milliseconds on the original master timeline.
 */
import { createEditSession, editSessionReducer } from './edit-session';
import type { EditOperation, EditSession } from './edit-session';

/**
 * Serialize a session to its canonical operations list. A trim spanning the
 * whole master is omitted; cuts follow in start order.
 *
 * @param session    - The session to serialize.
 * @param durationMs - Master duration in ms, used to detect a full-range trim.
 * @return The canonical operations list.
 */
export function sessionToOperations( session: EditSession, durationMs: number ): EditOperation[] {
	const operations: EditOperation[] = [];

	if ( session.trimStartMs > 0 || session.trimEndMs < durationMs ) {
		operations.push( {
			type: 'trim',
			start_ms: session.trimStartMs,
			end_ms: session.trimEndMs,
		} );
	}

	const cuts = [ ...session.cuts ].sort( ( a, b ) => a.startMs - b.startMs );
	for ( const cut of cuts ) {
		operations.push( { type: 'cut', start_ms: cut.startMs, end_ms: cut.endMs } );
	}

	return operations;
}

/**
 * Build a session from a serialized operations list. Input is normalized the
 * same way the reducer normalizes everything else: cuts are rounded, clipped
 * to the trim window, sorted, and merged.
 *
 * @param operations - Serialized operations (server order not required).
 * @param durationMs - Master duration in ms.
 * @return The loaded session.
 */
export function operationsToSession(
	operations: EditOperation[],
	durationMs: number
): EditSession {
	return editSessionReducer( createEditSession( durationMs ), {
		type: 'LOAD',
		operations,
		durationMs,
	} );
}

/**
 * Deep equality of two operations lists (type and timestamps, in order).
 *
 * @param a - One operations list.
 * @param b - Another operations list.
 * @return Whether the lists are identical.
 */
export function areOperationsEqual( a: EditOperation[], b: EditOperation[] ): boolean {
	return (
		a.length === b.length &&
		a.every(
			( op, i ) =>
				op.type === b[ i ].type && op.start_ms === b[ i ].start_ms && op.end_ms === b[ i ].end_ms
		)
	);
}

/**
 * Whether the session differs from the server baseline. Both sides are
 * normalized to canonical operations before comparing, so cosmetic
 * differences in the baseline (ordering, an explicit full-range trim) do not
 * count as dirty.
 *
 * @param session     - Current session.
 * @param baselineOps - Operations last persisted by the server.
 * @return True when saving would change the server state.
 */
export function isDirty( session: EditSession, baselineOps: EditOperation[] ): boolean {
	const durationMs = session.durationMs;
	const current = sessionToOperations( session, durationMs );
	const baseline = sessionToOperations(
		operationsToSession( baselineOps, durationMs ),
		durationMs
	);
	return ! areOperationsEqual( current, baseline );
}
