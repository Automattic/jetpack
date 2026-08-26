import { useGlobalNotices } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';

/**
 * Helpers to carry a success notice across a page reload.
 *
 * Some product toggles reload the page so server-rendered UI (e.g. the wp-admin
 * sidebar) reflects the change. A client-side notice wouldn't survive that reload,
 * so we stash it in sessionStorage and replay it on the next page load.
 */

const PENDING_NOTICE_KEY = 'myJetpackPendingSuccessNotice';

type PendingSuccessNotice = {
	message: string;
	customizeMenu: boolean;
};

/**
 * Store a success notice to be shown after the next page load.
 *
 * @param {string}  message       - The notice message.
 * @param {boolean} customizeMenu - Whether to offer the menu editor after replay.
 */
export function setPendingSuccessNotice( message: string, customizeMenu = true ): void {
	try {
		window.sessionStorage?.setItem(
			PENDING_NOTICE_KEY,
			JSON.stringify( { message, customizeMenu } )
		);
	} catch {
		// sessionStorage may be unavailable; the notice is non-critical.
	}
}

/**
 * Read and clear any pending success notice.
 *
 * @return {PendingSuccessNotice | null} The stored notice, or null if none.
 */
export function consumePendingSuccessNotice(): PendingSuccessNotice | null {
	try {
		const stored = window.sessionStorage?.getItem( PENDING_NOTICE_KEY ) ?? null;
		if ( stored ) {
			window.sessionStorage.removeItem( PENDING_NOTICE_KEY );
		}
		if ( ! stored ) {
			return null;
		}

		try {
			const notice = JSON.parse( stored ) as Partial< PendingSuccessNotice >;
			if ( typeof notice.message === 'string' ) {
				return {
					message: notice.message,
					customizeMenu: notice.customizeMenu === true,
				};
			}
		} catch {
			return { message: stored, customizeMenu: false };
		}

		return null;
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
		const notice = consumePendingSuccessNotice();
		if ( notice ) {
			createSuccessNotice(
				notice.message,
				notice.customizeMenu
					? {
							actions: [
								{
									label: __( 'Customize menu', 'jetpack-my-jetpack' ),
									url: 'admin.php?page=my-jetpack#/customize',
								},
							],
					  }
					: undefined
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount.
	}, [] );
}
