/* global jQuery */

import { KeptModals } from './kept-modals.ts';

// Each kept modal holds a whole admin page in its iframe, so only the most recent few stay.
const MAX_KEPT = 3;

// The ids thickbox finds its modal by, moved aside while a kept modal is hidden.
const THICKBOX_IDS = '[id^="TB_"], [data-wpcom-tb-id]';

/**
 * Keeps a card's details modal after it closes, so reopening it skips the ~4s reload.
 *
 * Thickbox rebuilds the modal and its iframe on every open. For our cards, closing now hides it
 * instead, and reopening shows it again with core's own sizing, focus handling and tab trap.
 *
 * @param {Document} doc - The Add Plugins page.
 */
export function keepDetailsModals( doc ) {
	const $ = jQuery;
	const grid = doc.querySelector( '.wpcom-marketplace-grid' );
	const removeModal = window.tb_remove;

	if ( ! grid || typeof removeModal !== 'function' ) {
		return;
	}

	const kept = new KeptModals( MAX_KEPT );
	const loaded = new WeakSet();
	const hiding = new WeakSet();
	let open = null;

	$( doc.body ).on( 'thickbox:iframe:loaded', () => {
		const modal = doc.getElementById( 'TB_window' );
		if ( modal ) {
			loaded.add( modal );
		}
	} );

	grid.addEventListener( 'click', event => {
		const link = event.target.closest( 'a.open-plugin-details-modal' );
		const card = link?.closest( '.wpcom-marketplace-card' );

		open = null;

		// An installed plugin's modal has Activate and Update buttons whose state changes, so core rebuilds it.
		if ( ! card || card.dataset.installed === 'true' ) {
			return;
		}

		open = { key: pluginOf( link.href ), opener: link };

		const modal = kept.take( open.key );
		if ( modal ) {
			// Otherwise plugin-install.js, delegating from .wrap, opens a fresh copy as well.
			event.preventDefault();
			event.stopPropagation();
			show( modal );
		}
	} );

	window.tb_remove = function ( ...args ) {
		const modal = doc.getElementById( 'TB_window' );

		// Core binds Escape inside the iframe again on every reopen, so one keypress can close twice.
		if ( modal && hiding.has( modal ) ) {
			return false;
		}

		const overlay = doc.getElementById( 'TB_overlay' );

		// A modal still loading is dropped, so its iframe does not finish into another modal's ids.
		if (
			! open ||
			! modal ||
			! overlay ||
			! loaded.has( modal ) ||
			pluginOf( iframeSrc( modal ) ) !== open.key
		) {
			open = null;
			return removeModal.apply( this, args );
		}

		const { key, opener } = open;
		open = null;

		hide( modal, overlay, opener );
		for ( const dropped of kept.keep( key, { modal, overlay } ) ) {
			$( [ dropped.modal, dropped.overlay ] ).remove();
		}

		return false;
	};

	/**
	 * Hides a modal the way tb_remove() removes one, keeping it and its iframe in the page.
	 *
	 * @param {HTMLElement} modal   - Thickbox's #TB_window.
	 * @param {HTMLElement} overlay - Thickbox's #TB_overlay.
	 * @param {HTMLElement} opener  - The link that opened it, which gets focus back.
	 */
	function hide( modal, overlay, opener ) {
		hiding.add( modal );

		$( modal ).fadeOut( 'fast', () => {
			hiding.delete( modal );
			overlay.style.display = 'none';
			moveIds( [ overlay, modal, ...modal.querySelectorAll( THICKBOX_IDS ) ], false );
			// Core refocuses on 'thickbox:removed', which only fires on removal and names the first opener.
			opener.focus();
		} );

		doc.body.classList.remove( 'modal-open' );
		doc.getElementById( 'TB_load' )?.remove();
		$( doc ).off( '.thickbox' );
	}

	/**
	 * Shows a kept modal again, as tb_show() and plugin-install.js would a fresh one.
	 *
	 * @param {object}      kept         - A kept modal.
	 * @param {HTMLElement} kept.modal   - Its #TB_window.
	 * @param {HTMLElement} kept.overlay - Its #TB_overlay.
	 */
	function show( { modal, overlay } ) {
		moveIds( [ overlay, modal, ...modal.querySelectorAll( THICKBOX_IDS ) ], true );
		overlay.style.display = '';
		$( modal ).show();
		doc.body.classList.add( 'modal-open' );

		$( doc ).on( 'keydown.thickbox', event => {
			if ( 27 === event.which ) {
				window.tb_remove();
				return false;
			}
		} );

		// Resizes it to the window, and points plugin-install.js back at it to reset focus and the tab trap.
		window.tb_position();
		$( modal ).trigger( 'thickbox:iframe:loaded' );
	}
}

/**
 * Moves thickbox's ids aside while a modal is hidden, and back when it shows, so only one answers to them.
 *
 * @param {HTMLElement[]} elements - The modal, its overlay and everything in it with a thickbox id.
 * @param {boolean}       restore  - True to put the ids back.
 */
function moveIds( elements, restore ) {
	for ( const element of elements ) {
		if ( restore && element.dataset.wpcomTbId ) {
			element.id = element.dataset.wpcomTbId;
			delete element.dataset.wpcomTbId;
		} else if ( ! restore && element.id.startsWith( 'TB_' ) ) {
			element.dataset.wpcomTbId = element.id;
			element.removeAttribute( 'id' );
		}
	}
}

/**
 * The src of a modal's iframe.
 *
 * @param {HTMLElement} modal - Thickbox's #TB_window.
 * @return {string} The src, or an empty string when it has no iframe.
 */
function iframeSrc( modal ) {
	return modal.querySelector( 'iframe' )?.src ?? '';
}

/**
 * The plugin a details URL is for, which both the link and the modal's iframe carry.
 *
 * @param {string} url - A details link's href, or its modal's iframe src.
 * @return {string|null} Plugin slug, or null when the URL names none.
 */
function pluginOf( url ) {
	try {
		return new URL( url, window.location.href ).searchParams.get( 'plugin' );
	} catch {
		return null;
	}
}
