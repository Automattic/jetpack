/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

const jetpackElementId = 'toplevel_page_jetpack';

/**
 * React custom hook to addess the Jetpack menu in the wp-admin.
 *
 * @param {string} name - Product name.
 * @param {string} url  - Product admin url.
 * @returns {object}      Helper functions
 */
export default function useMenuItem( name, url ) {
	const menutItems = useRef();

	// Reference the Jetpac main menu reference.
	useEffect( () => {
		if ( menutItems?.current ) {
			return;
		}

		menutItems.current = document.getElementById( jetpackElementId );
	}, [] );

	/**
	 * Helper function to pics the menu item,
	 * and its before element reference,
	 * according to the Product name.
	 *
	 * @returns {Array} An array with Item and Before element references
	 */
	function scanAndPickElements() {
		if ( ! menutItems?.current ) {
			return [];
		}

		const items = menutItems.current.querySelectorAll( 'ul.wp-submenu > li' );
		let menuItem, beforeItem;

		for ( const i in items ) {
			const item = items[ i ];

			// Try to pick the item according to the name.
			if ( item?.innerText === name ) {
				menuItem = item;
			}

			// Try to pick the previous item.
			if ( item?.innerText < name ) {
				beforeItem = item;
			}
		}

		return [ menuItem, beforeItem ];
	}

	/**
	 * Helper function to add the menu item.
	 */
	function add() {
		const [ item, before ] = scanAndPickElements();
		if ( item ) {
			return;
		}

		const freshItem = document.createElement( 'li' );
		freshItem.innerHTML = `<a href="${ url }">${ name }</a>`;

		if ( before ) {
			if ( before.nextSibling ) {
				before.parentElement.insertBefore( freshItem, before.nextSibling );
			} else {
				before.parentElement.appendChild( freshItem );
			}
		}
	}

	/**
	 * Helper function to remove the menu item.
	 */
	function remove() {
		const [ item ] = scanAndPickElements();
		if ( ! item ) {
			return;
		}
		item.remove();
	}

	return { add, remove };
}
