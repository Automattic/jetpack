/**
 * Inserter utility functions
 *
 * Pure functions for determining inserter behavior with no side effects.
 *
 * @package
 */

export interface AutoOpenInserterContext {
	/** The viewport width in pixels. */
	viewportWidth: number;
	/** Whether the user prefers the list view sidebar by default. */
	showListViewByDefault: boolean;
	/** Whether the user is in distraction-free mode. */
	distractionFree: boolean;
}

const DESKTOP_MIN_WIDTH = 782;

/**
 * Determines whether the block inserter should be automatically opened.
 *
 * Returns false when the viewport is below 782px (mobile), the user
 * prefers list view by default (same sidebar slot), or distraction-free
 * mode is active (Gutenberg hides the inserter).
 *
 * @param context - Current editor environment context
 * @return Whether the inserter should be auto-opened
 */
export function shouldAutoOpenInserter( context: AutoOpenInserterContext ): boolean {
	if ( context.viewportWidth < DESKTOP_MIN_WIDTH ) {
		return false;
	}

	if ( context.showListViewByDefault ) {
		return false;
	}

	if ( context.distractionFree ) {
		return false;
	}
	return true;
}
