import { useGlobalNotices } from '@automattic/jetpack-components';
import { useEffect } from 'react';

/**
 * Helpers to carry a success notice across a page reload.
 *
 * Some product toggles reload the page so server-rendered UI (e.g. the wp-admin
 * sidebar) reflects the change. A client-side notice wouldn't survive that reload,
 * so we stash it in sessionStorage and replay it on the next page load.
 */

const PENDING_NOTICE_KEY = 'myJetpackPendingSuccessNotice';

/**
 * Store a success notice to be shown after the next page load.
 *
 * @param {string} message - The notice message.
 */
export function setPendingSuccessNotice( message: string ): void {
	try {
		window.sessionStorage?.setItem( PENDING_NOTICE_KEY, message );
	} catch {
		// sessionStorage may be unavailable; the notice is non-critical.
	}
}

/**
 * Read and clear any pending success notice.
 *
 * @return {string | null} The stored message, or null if none.
 */
export function consumePendingSuccessNotice(): string | null {
	try {
		const message = window.sessionStorage?.getItem( PENDING_NOTICE_KEY ) ?? null;
		if ( message ) {
			window.sessionStorage.removeItem( PENDING_NOTICE_KEY );
		}
		return message;
	} catch {
		/* istanbul ignore next -- sessionStorage may be unavailable (e.g. private mode). */
		return null;
	}
}

/**
 * On mount, replays any success notice persisted before a page reload.
 */
export function useReplayPendingNotice(): void {
	const { createSuccessNotice } = useGlobalNotices();

	// Consume the stored notice exactly once on mount. It must not re-run on later
	// re-renders (e.g. a product refetch), or it would consume the notice on the page
	// that set it — before the reload — so it would never reach the freshly-loaded page.
	useEffect( () => {
		const message = consumePendingSuccessNotice();
		if ( message ) {
			createSuccessNotice( message );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount.
	}, [] );
}
