/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useConfigValue from '../../hooks/use-config-value.ts';
import { getNewFormEditorUrl } from '../utils.ts';

/**
 * Upper bound on how many subresources we will warm.
 *
 * The block editor screen enqueues well over a hundred scripts and stylesheets, which is exactly
 * what makes it slow to open. The cap is only here so a pathological page can't make us issue an
 * unbounded number of requests.
 */
const MAX_PREFETCHED_ASSETS = 300;

/**
 * Module-level latch. Warming the cache is only useful once per page load, and the request that
 * discovers the asset list is not free, so we never run it twice.
 */
let hasPreloadStarted = false;

/**
 * Reset the once-per-page latch. Test-only.
 */
export function resetEditorPreloadState(): void {
	hasPreloadStarted = false;
}

/**
 * Whether the browser will honour <link rel="prefetch">.
 *
 * WebKit has never shipped it, so on Safari the link element is inert and we have to warm the cache
 * some other way or the whole optimization is cost without benefit.
 *
 * @return Whether <link rel="prefetch"> will do anything.
 */
function supportsLinkPrefetch(): boolean {
	try {
		return !! document.createElement( 'link' ).relList?.supports?.( 'prefetch' );
	} catch {
		return false;
	}
}

/**
 * Whether the user has asked us not to spend their bandwidth speculatively.
 *
 * @return Whether to skip the warm-up entirely.
 */
function prefersLessData(): boolean {
	const connection = (
		navigator as Navigator & {
			connection?: { saveData?: boolean; effectiveType?: string };
		}
	 ).connection;

	return !! connection?.saveData || [ 'slow-2g', '2g' ].includes( connection?.effectiveType ?? '' );
}

/**
 * Warm the cache for a single subresource.
 *
 * @param href            - Absolute URL of the asset.
 * @param as              - The `as` value describing the asset ("script" or "style").
 * @param useLinkPrefetch - Whether to use <link rel="prefetch"> rather than a low-priority fetch.
 */
function warmAsset( href: string, as: 'script' | 'style', useLinkPrefetch: boolean ): void {
	if ( ! useLinkPrefetch ) {
		// Same cache entry, just without the browser's idle-priority scheduling.
		fetch( href, { credentials: 'same-origin', priority: 'low' } as RequestInit ).catch( () => {} );
		return;
	}

	const link = document.createElement( 'link' );

	link.rel = 'prefetch';
	link.as = as;
	link.href = href;

	document.head.appendChild( link );
}

/**
 * Warm the browser cache for the block editor screen that creating a form navigates to.
 *
 * Opening a form is a full wp-admin page load, and the bulk of the wait is downloading and parsing
 * the editor's scripts and stylesheets. Those are static, cacheable files, so fetching them ahead of
 * time turns most of that wait into cache hits.
 *
 * We deliberately do not use a hidden iframe: rendering the editor off-screen would boot a second
 * copy of Gutenberg and compete with the dashboard for the main thread. Instead we fetch the editor
 * HTML (which never executes), read the asset list out of it, and warm those assets at low priority.
 * The wp-admin document itself is sent with no-store headers and cannot be reused, so there is
 * nothing to gain from warming it.
 *
 * Scraping the page for its asset list is the shortcut here, and it has two costs worth naming.
 * WordPress knows this list server-side, so discovering it this way spends a whole duplicate editor
 * render that is thrown away — and that render happens before any prefetch can start, so it eats
 * into the head start we are buying. It also creates an `auto-draft` post as a side effect, exactly
 * as clicking through would. (Auto-drafts are excluded from every Forms query and core
 * garbage-collects them after seven days, so the extra row is not user-visible.) Passing the asset
 * URLs down through the dashboard config instead would remove the render, the parse and the
 * auto-draft; reproducing the block editor's enqueue list outside the real screen load is the
 * awkward part, which is why this does it the blunt way for now.
 *
 * @param editorUrl - The editor URL to warm.
 * @return Whether the warm-up actually ran, so a no-op can be retried later.
 */
async function preloadEditorAssets( editorUrl: string ): Promise< boolean > {
	const base = new URL( editorUrl, window.location.href );

	// An admin on another origin would not receive our cookies here, so the request could only ever
	// warm the login page. Skip it rather than spend a round trip on nothing.
	if ( base.origin !== window.location.origin ) {
		return false;
	}

	const response = await fetch( base.href, { credentials: 'same-origin' } );

	if ( ! response.ok ) {
		return false;
	}

	const doc = new DOMParser().parseFromString( await response.text(), 'text/html' );
	const seen = new Set< string >();
	const useLinkPrefetch = supportsLinkPrefetch();

	const queue = ( rawHref: string | null, as: 'script' | 'style' ) => {
		if ( ! rawHref || seen.size >= MAX_PREFETCHED_ASSETS ) {
			return;
		}

		// Resolve against the editor URL so root-relative and protocol-relative sources work.
		let asset: URL;
		try {
			asset = new URL( rawHref, base );
		} catch {
			return;
		}

		// Only warm our own origin. Third-party assets are not ours to speculatively request.
		if ( asset.origin !== window.location.origin || seen.has( asset.href ) ) {
			return;
		}

		seen.add( asset.href );
		warmAsset( asset.href, as, useLinkPrefetch );
	};

	// Stylesheets first: they are render-blocking and far smaller, so queueing them ahead of the
	// scripts gets the editor painting sooner when requests are served in order.
	doc
		.querySelectorAll( 'link[rel="stylesheet"][href]' )
		.forEach( el => queue( el.getAttribute( 'href' ), 'style' ) );
	doc
		.querySelectorAll( 'script[src]' )
		.forEach( el => queue( el.getAttribute( 'src' ), 'script' ) );

	return true;
}

/**
 * Hook returning a function that warms the browser cache for the new-form editor.
 *
 * Call it as soon as the user shows intent to create a form — typing a title, for example — so the
 * download overlaps with the time they spend in the modal. It is safe to call repeatedly; only the
 * first call in a page load does any work, and failures are swallowed because a cold cache is a
 * slower experience, not a broken one.
 *
 * @return A no-argument preload trigger.
 */
export default function useEditorPreload(): () => void {
	const adminUrl = useConfigValue( 'adminUrl' );

	return useCallback( () => {
		// The config store loads asynchronously. Without a base URL we would guess at a relative one
		// and likely 404, so wait to be called again rather than burning the single attempt.
		if ( hasPreloadStarted || ! adminUrl || prefersLessData() ) {
			return;
		}

		hasPreloadStarted = true;

		preloadEditorAssets( getNewFormEditorUrl( undefined, adminUrl ) )
			.catch( () => false )
			.then( started => {
				// Best-effort: if nothing was warmed, allow a later attempt.
				hasPreloadStarted = started;
			} );
	}, [ adminUrl ] );
}
