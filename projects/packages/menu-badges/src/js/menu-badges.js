/**
 * Client live-update API for Jetpack admin-menu notification badges.
 *
 * Products call window.jetpackMenuBadges.setCount( menuSlug, count ) after a
 * state change; this updates that badge and recomputes the top-level total from
 * the DOM (each badge carries its own data-jp-menu-count).
 */
/* eslint-disable no-var -- shipped as-is with no build step, so it stays ES5-compatible */
( function () {
	/**
	 * Update a single badge element's count, in its DOM attribute, class, and visible text.
	 *
	 * @param {Element} el    - The badge element.
	 * @param {number}  count - The new count.
	 */
	function setBadgeCount( el, count ) {
		el.setAttribute( 'data-jp-menu-count', String( count ) );
		var oldClass = ( el.className.match( /count-\d+/ ) || [] )[ 0 ];
		if ( oldClass ) {
			el.className = el.className.replace( oldClass, 'count-' + count );
		}
		var inner = el.querySelector( '.count' );
		if ( inner ) {
			inner.textContent = String( count );
		}
	}

	/**
	 * Recompute the top-level total badge as the sum of all non-total badge counts.
	 */
	function recomputeTotal() {
		var total = 0;
		var badges = document.querySelectorAll( '[data-jp-menu-count]' );
		badges.forEach( function ( el ) {
			if ( el.getAttribute( 'data-jp-menu-badge-total' ) === '1' ) {
				return;
			}
			total += parseInt( el.getAttribute( 'data-jp-menu-count' ), 10 ) || 0;
		} );
		var totalEl = document.querySelector( '[data-jp-menu-badge-total="1"]' );
		if ( totalEl ) {
			setBadgeCount( totalEl, total );
		}
	}

	/**
	 * Set the count for the badge matching the given menu slug, then recompute the total.
	 *
	 * @param {string} menuSlug - The menu slug the badge was registered with, i.e. `data-jp-menu-badge`.
	 * @param {number} count    - The new count. Clamped to >= 0.
	 */
	function setCount( menuSlug, count ) {
		count = Math.max( 0, parseInt( count, 10 ) || 0 );
		var el = document.querySelector( '[data-jp-menu-badge="' + menuSlug + '"]' );
		if ( el ) {
			setBadgeCount( el, count );
		}
		recomputeTotal();
	}

	window.jetpackMenuBadges = window.jetpackMenuBadges || {};
	window.jetpackMenuBadges.setCount = setCount;
} )();
