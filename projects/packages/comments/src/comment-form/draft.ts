/**
 * An unsent comment, kept per tab and per post.
 *
 * sessionStorage clears when the tab closes, which is about as long as an unsent
 * comment is worth keeping.
 */

/**
 * Storage key for a post's draft.
 *
 * Keyed per post rather than per page, because a query loop can put several
 * comment forms on one page and they must not share a draft.
 *
 * @param postId - The post being commented on.
 * @return The storage key.
 */
const keyFor = ( postId: number ) => `jetpack-comments-draft-${ postId }`;

/**
 * Read back an unsent comment.
 *
 * @param postId - The post being commented on.
 * @return The saved draft, or an empty string.
 */
export function readDraft( postId: number ): string {
	try {
		return sessionStorage.getItem( keyFor( postId ) ) ?? '';
	} catch {
		// Storage can be blocked outright. A missing draft is not worth throwing over.
		return '';
	}
}

/**
 * Hold on to an unsent comment.
 *
 * @param postId - The post being commented on.
 * @param value  - What has been typed so far.
 */
export function saveDraft( postId: number, value: string ) {
	try {
		if ( value ) {
			sessionStorage.setItem( keyFor( postId ), value );
		} else {
			sessionStorage.removeItem( keyFor( postId ) );
		}
	} catch {
		// Blocked or full. Losing a draft beats breaking the form.
	}
}
