/**
 * An unsent comment, kept in sessionStorage per tab and per post.
 */

const keyFor = ( postId: number ) => `jetpack-comments-draft-${ postId }`;
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
 * Note that the form was submitted, keeping the draft: wp-comments-post.php can
 * still reject it, and the reader lands on an error page with no way back.
 *
 * @param postId - The post being commented on.
 */
export function markSubmitted( postId: number ): void {
	try {
		sessionStorage.setItem( sentKeyFor( postId ), window.location.hash );
	} catch {
		// A draft that cannot be marked is simply offered again.
	}
}

/**
 * Settle a submitted draft: an accepted comment lands on its own `#comment-<id>`,
 * so a fragment the reader was not already on is the one signal that it posted.
 *
 * @param postId - The post being commented on.
 */
export function resolveSubmitted( postId: number ): void {
	try {
		const sentFrom = sessionStorage.getItem( sentKeyFor( postId ) );

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
