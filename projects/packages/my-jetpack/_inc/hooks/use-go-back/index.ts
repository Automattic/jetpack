import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { MyJetpackRoutes } from '../../constants';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import useAnalytics from '../use-analytics';
import type { MouseEvent } from 'react';

/**
 * The key of the current browser history entry.
 *
 * @return The entry's key, or null without the Navigation API.
 */
export function getHistoryEntryKey(): string | null {
	return window.navigation?.currentEntry?.key ?? null;
}

/**
 * How far back the history entry with `key` is from the current one.
 *
 * @param key - The entry's key.
 * @return A negative delta, or null when the entry is gone or not behind the current one.
 */
function getDeltaBackTo( key: string ): number | null {
	const current = window.navigation?.currentEntry;
	const entry = window.navigation?.entries().find( ( { key: entryKey } ) => entryKey === key );
	if ( ! current || ! entry || entry.index >= current.index ) {
		return null;
	}
	return entry.index - current.index;
}

/**
 * Custom React hook to handle back link click with analytics.
 *
 * Goes back in history to the My Jetpack tab last shown when it is behind this screen, or one
 * entry when the page came from an allowed site; otherwise goes to `fallback`.
 *
 * @param options          - Options.
 * @param options.slug     - Product slug, recorded with the analytics event.
 * @param options.fallback - Route used when no tab is behind this screen in history and the page did not come from an allowed site. Defaults to `MyJetpackRoutes.Home`.
 * @return Object with the back link destination and its click handler with analytics.
 */
export function useGoBack( {
	slug,
	fallback = MyJetpackRoutes.Home,
}: {
	slug: string;
	fallback?: string;
} ) {
	const { recordEvent } = useAnalytics();
	const navigate = useNavigate();
	const [ lastTab ] = useValueStore( 'lastTab', null );
	const backTo = lastTab?.path ?? fallback;

	const onClickGoBack = useCallback(
		( event: MouseEvent ) => {
			if ( slug ) {
				recordEvent( 'jetpack_myjetpack_product_interstitial_back_link_click', { product: slug } );
			}

			event.preventDefault();

			// When the tab is behind this screen in history, go back to it instead of pushing `backTo`,
			// which would leave the screen showing this back link under the browser's Back button.
			const delta = lastTab?.key ? getDeltaBackTo( lastTab.key ) : null;
			if ( delta !== null ) {
				navigate( delta );
				return;
			}

			// Check if referrer is from allowed sites (current site, wordpress.com, jetpack.com)
			const allowedReferrers = [
				window.location.host, // Current site (internal navigation)
				'wordpress.com', // WordPress.com auth/management
				'jetpack.com', // Jetpack.com documentation/links
			];

			let referrerHostname = '';
			try {
				referrerHostname = new URL( document.referrer ).hostname;
			} catch {
				// If referrer is not a valid URL, leave referrerHostname as an empty string
			}

			const isFromAllowedSite = allowedReferrers.includes( referrerHostname );
			if ( isFromAllowedSite && window.history.length > 1 ) {
				navigate( -1 );
			} else {
				navigate( fallback );
			}
		},
		[ slug, recordEvent, navigate, lastTab, fallback ]
	);

	return { onClickGoBack, backTo };
}
