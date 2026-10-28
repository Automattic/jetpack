/**
 * The ID a row's detail route takes, when the row has a detail page.
 *
 * Report rows carry IDs as numbers or strings, and some, such as the homepage
 * entry, carry 0 for content without a page of its own.
 *
 * @param id - The row's post, page or video ID.
 * @return The ID as a positive integer, or undefined when the row has no detail page.
 */
export function toDetailId( id?: number | string | null ): number | undefined {
	const value = Number( id );

	return Number.isInteger( value ) && value > 0 ? value : undefined;
}
