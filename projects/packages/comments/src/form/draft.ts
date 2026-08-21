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
 * Storage key marking that a post's draft has been handed to the server.
 *
 * @param postId - The post being commented on.
 * @return The storage key.
 */
const sentKeyFor = ( postId: number ) => `jetpack-comments-sent-${ postId }`;

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

/**
 * Note that the form has been submitted, without dropping what it carried.
 *
 * The draft has to outlive the POST. wp-comments-post.php can still reject it,
 * for a failed nonce or a duplicate or a missing required field, and the reader
 * lands on an error page with no way back to what they wrote.
 *
 * Records where they were when they sent it, which is what tells a comment that
 * landed apart from one that came straight back.
 *
 * @param postId - The post being commented on.
 */
export function markSubmitted( postId: number ): void {
	try {
		sessionStorage.setItem( sentKeyFor( postId ), window.location.hash );
	} catch {
		// A draft that cannot be marked is one that will simply be offered again.
	}
}

/**
 * Settle a draft that was submitted, now that the outcome is known.
 *
 * A comment that was accepted sends the reader to its own permalink, so a
 * `#comment-<id>` fragment they were not already on is the one signal available
 * that it landed. Arriving from a comment permalink and being turned away leaves
 * them on the fragment they came in on, and that draft is still theirs.
 *
 * @param postId - The post being commented on.
 */
export function resolveSubmitted( postId: number ): void {
	try {
		const sentFrom = sessionStorage.getItem( sentKeyFor( postId ) );

		// An empty string is a real value here, so test for absence rather than truth.
		if ( sentFrom === null ) {
			return;
		}

		sessionStorage.removeItem( sentKeyFor( postId ) );

		const hash = window.location.hash;

		if ( hash !== sentFrom && /^#comment-\d+$/.test( hash ) ) {
			saveDraft( postId, '' );
		}
	} catch {
		// Nothing to settle without storage.
	}
}
