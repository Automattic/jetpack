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
 * tick, because enforcement can bail out on the tick that first observes it —
 * either because the form block has not been located yet (editor still settling)
 * or because a multi-selection is active. Treating an already-empty selection as
 * "no change" would leave the form permanently deselected once that cleared.
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

export interface FormBlockSelectionContext {
	/** The block currently selected in the editor, if any. */
	selectedBlockId: string | null | undefined;
	/** Whether the editor currently holds a multi-block selection. */
	hasMultiSelection: boolean;
}

/**
 * Determines whether the form block should be force-selected right now.
 *
 * Deliberately independent of whether the inserter is open. Selecting a block
 * neither closes the inserter nor changes where it inserts, and the inserter is
 * open by default in the form editor — so skipping enforcement while it is open
 * leaves the form deselected and its settings unreachable for the common case.
 *
 * A multi-selection is still respected: getSelectedBlockClientId() is null while
 * one is active, and force-selecting would discard the user's range.
 *
 * @param context - Current selection state
 * @return Whether the form block should be selected
 */
export function shouldSelectFormBlock( context: FormBlockSelectionContext ): boolean {
	if ( context.hasMultiSelection ) {
		return false;
	}

	return ! context.selectedBlockId;
}
