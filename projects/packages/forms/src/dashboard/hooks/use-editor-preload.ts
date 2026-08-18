/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useConfigValue from '../../hooks/use-config-value.ts';

/**
 * Upper bound on how many subresources we will queue for prefetching.
 *
 * The block editor screen enqueues well over a hundred scripts and stylesheets, which is exactly
 * what makes it slow to open. The cap is only here so a pathological page can't make us inject an
 * unbounded number of <link> elements.
 */
const MAX_PREFETCHED_ASSETS = 300;

/**
 * Marks the <link> elements we inject, so repeated calls can recognise their own work.
 */
const PRELOAD_LINK_ATTRIBUTE = 'data-jetpack-forms-editor-preload';

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
	document.querySelectorAll( `link[${ PRELOAD_LINK_ATTRIBUTE }]` ).forEach( link => link.remove() );
}

/**
 * Build the wp-admin URL that opens the block editor on a new form.
 *
 * @param adminUrl  - Absolute wp-admin URL, from the dashboard config.
 * @param formTitle - Optional title to seed the new post with.
 * @return The editor URL.
 */
export function getNewFormEditorUrl( adminUrl: string | undefined, formTitle?: string ): string {
	let url = `${ adminUrl || '' }post-new.php?post_type=jetpack_form`;
	const trimmedFormTitle = formTitle?.trim();

	if ( trimmedFormTitle ) {
		url += `&post_title=${ encodeURIComponent( trimmedFormTitle ) }`;
	}

	return url;
}

/**
 * Queue a low-priority prefetch for a single subresource.
 *
 * @param href - Absolute URL of the asset.
 * @param as   - The `as` value describing the asset ("script" or "style").
 */
function prefetchAsset( href: string, as: 'script' | 'style' ): void {
	const link = document.createElement( 'link' );

	link.rel = 'prefetch';
	link.as = as;
	link.href = href;
	link.setAttribute( PRELOAD_LINK_ATTRIBUTE, '' );

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
 * HTML (which never executes), read the asset list out of it, and prefetch those assets at low
 * priority. The wp-admin document itself is sent with no-store headers and cannot be reused, so
 * there is nothing to gain from prefetching it.
 *
 * Note that requesting `post-new.php` creates an `auto-draft` post, exactly as clicking through
 * would. Auto-drafts are excluded from every Forms query and WordPress core garbage-collects them
 * after seven days, so the extra row is not user-visible.
 *
 * @param editorUrl - The editor URL to warm.
 */
async function preloadEditorAssets( editorUrl: string ): Promise< void > {
	const base = new URL( editorUrl, window.location.href );

	// An admin on another origin would not receive our cookies here, so the request could only ever
	// warm the login page. Skip it rather than spend a round trip on nothing.
	if ( base.origin !== window.location.origin ) {
		return;
	}

	const response = await fetch( base.href, { credentials: 'same-origin' } );

	if ( ! response.ok ) {
		return;
	}

	const doc = new DOMParser().parseFromString( await response.text(), 'text/html' );
	const seen = new Set< string >();
	let queued = 0;

	const queue = ( rawHref: string | null, as: 'script' | 'style' ) => {
		if ( ! rawHref || queued >= MAX_PREFETCHED_ASSETS ) {
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
		queued++;
		prefetchAsset( asset.href, as );
	};

	doc
		.querySelectorAll( 'script[src]' )
		.forEach( el => queue( el.getAttribute( 'src' ), 'script' ) );
	doc
		.querySelectorAll( 'link[rel="stylesheet"][href]' )
		.forEach( el => queue( el.getAttribute( 'href' ), 'style' ) );
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
		if ( hasPreloadStarted ) {
			return;
		}

		hasPreloadStarted = true;

		preloadEditorAssets( getNewFormEditorUrl( adminUrl ) ).catch( () => {
			// Preloading is best-effort. Allow a later attempt if this one never got off the ground.
			hasPreloadStarted = false;
		} );
	}, [ adminUrl ] );
}
