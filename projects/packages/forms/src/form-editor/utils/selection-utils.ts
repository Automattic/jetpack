/**
 * Selection utility functions
 *
 * Pure functions for determining form editor selection behavior with no side effects.
 *
 * @package
 */

export interface SelectionEnforcementContext {
	/** The block currently selected in the editor, if any. */
	selectedBlockId: string | null | undefined;
	/** The selection observed on the previous subscribe tick. */
	lastSelectedBlockId: string | null | undefined;
}

/**
 * Determines whether a selection-enforcement pass should run on this tick.
 *
 * A changed selection always needs a pass. An empty selection needs one on every
 * tick, because enforcement can bail out (inserter open, multi-selection) on the
 * tick that first observes it — treating an already-empty selection as "no change"
 * would leave the form permanently deselected once the blocking condition cleared.
 *
 * @param context - Current and previously observed selection
 * @return Whether enforcement should run
 */
export function shouldRunSelectionEnforcement( context: SelectionEnforcementContext ): boolean {
	if ( ! context.selectedBlockId ) {
		return true;
	}

	return context.selectedBlockId !== context.lastSelectedBlockId;
}
