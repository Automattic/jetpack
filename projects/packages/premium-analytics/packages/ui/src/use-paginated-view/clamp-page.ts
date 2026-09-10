/**
 * A page number brought back inside a result that has since shrunk.
 *
 * @param page       - The page the reader is on.
 * @param totalPages - How many pages the current result has.
 * @return The page to render.
 */
export function clampPage( page: number, totalPages: number ): number {
	return Math.min( Math.max( page, 1 ), Math.max( totalPages, 1 ) );
}
