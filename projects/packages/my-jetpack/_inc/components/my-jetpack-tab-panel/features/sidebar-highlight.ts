import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from 'react';

/**
 * Points the user at the wp-admin menu item a newly activated feature just added.
 *
 * Activating something like Forms adds a sidebar item, but the sidebar is
 * server-rendered, so the item only appears after the reload that follows. The target
 * is stashed before that reload and picked up on the next load, mirroring how
 * `pending-notice` carries a notice across the same boundary.
 */

const PENDING_HIGHLIGHT_KEY = 'myJetpackPendingSidebarHighlight';
const HIGHLIGHT_CLASS = 'jetpack-feature-sidebar-highlight';
const HIGHLIGHT_MS = 6000;

// wp-admin folds the sidebar into the toolbar at this width, so there is nothing to
// point at below it.
const ADMIN_MENU_BREAKPOINT = '(max-width: 782px)';

/**
 * The admin page slug a feature's manage URL points at, when it is one on this site.
 *
 * @param manageUrl - The feature's manage URL.
 * @return The slug, or null when the URL leaves wp-admin.
 */
export function getAdminPageSlug( manageUrl: string ): string | null {
	if ( ! manageUrl ) {
		return null;
	}

	try {
		const url = new URL( manageUrl, window.location.origin );

		if ( url.origin !== window.location.origin || ! url.pathname.includes( '/wp-admin/' ) ) {
			return null;
		}

		return url.searchParams.get( 'page' );
	} catch {
		return null;
	}
}

type PendingHighlight = {
	slug: string;
	name: string;
};

/**
 * Store the menu item to point at after the next page load.
 *
 * @param slug - Admin page slug of the newly activated feature.
 * @param name - The feature's name, for the tooltip.
 */
export function setPendingSidebarHighlight( slug: string, name: string ): void {
	try {
		window.sessionStorage?.setItem( PENDING_HIGHLIGHT_KEY, JSON.stringify( { slug, name } ) );
	} catch {
		// sessionStorage may be unavailable; the highlight is non-critical.
	}
}

/**
 * Read and clear any pending highlight target.
 *
 * @return The stored target, or null if none.
 */
function consumePendingSidebarHighlight(): PendingHighlight | null {
	try {
		const stored = window.sessionStorage?.getItem( PENDING_HIGHLIGHT_KEY ) ?? null;

		if ( ! stored ) {
			return null;
		}

		window.sessionStorage.removeItem( PENDING_HIGHLIGHT_KEY );

		const parsed = JSON.parse( stored );

		return parsed?.slug ? parsed : null;
	} catch {
		return null;
	}
}

/**
 * On mount, points at the sidebar item stored before the last reload.
 */
export function useHighlightNewSidebarItem(): void {
	// Consume once on mount: re-running would eat the value on the page that set it,
	// before the reload that is supposed to display it.
	useEffect( () => {
		const target = consumePendingSidebarHighlight();

		if ( ! target || window.matchMedia?.( ADMIN_MENU_BREAKPOINT ).matches ) {
			return;
		}

		const link = document.querySelector< HTMLElement >(
			`#adminmenu a[href*="page=${ target.slug }"]`
		);

		if ( ! link ) {
			return;
		}

		const item = link.closest( 'li' ) ?? link;

		// The tooltip is drawn from this attribute, so its copy stays translatable
		// rather than being baked into a stylesheet.
		item.dataset.jetpackHighlightLabel = sprintf(
			/* translators: %s is the feature name. */
			__( '%s is here', 'jetpack-my-jetpack' ),
			target.name
		);
		item.classList.add( HIGHLIGHT_CLASS );
		link.scrollIntoView( { block: 'nearest' } );

		const timer = setTimeout( () => {
			item.classList.remove( HIGHLIGHT_CLASS );
			delete item.dataset.jetpackHighlightLabel;
		}, HIGHLIGHT_MS );

		// Only the timer is cleaned up: removing the class here would let a remount
		// wipe a highlight that is still meant to be showing.
		return () => clearTimeout( timer );
	}, [] );
}
