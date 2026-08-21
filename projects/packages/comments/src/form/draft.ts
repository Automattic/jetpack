/**
 * An unsent comment, kept in sessionStorage per tab and per post.
 */

/**
 * Storage key for a post's draft.
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
		return '';
	}
}

/**
 * Hold on to an unsent comment.
 *
 * @param postId - The post being commented on.
 * @param value  - What has been typed so far.
 * @return Whether it was stored.
 */
export function saveDraft( postId: number, value: string ): boolean {
	try {
		if ( value ) {
			sessionStorage.setItem( keyFor( postId ), value );
		} else {
			sessionStorage.removeItem( keyFor( postId ) );
		}

		return true;
	} catch {
		return false;
	}
}
