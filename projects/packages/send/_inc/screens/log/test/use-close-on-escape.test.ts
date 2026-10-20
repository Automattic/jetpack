/* eslint-disable testing-library/no-node-access -- the hook reads the page's DOM, so the tests build it directly. */
import { renderHook } from '@testing-library/react';
import useCloseOnEscape from '../use-close-on-escape';

const add = ( html: string ) => {
	const holder = document.createElement( 'div' );
	holder.innerHTML = html;
	document.body.appendChild( holder );
	return holder.firstElementChild as HTMLElement;
};

const pressEscape = ( target: Element = document.body ) =>
	target.dispatchEvent( new KeyboardEvent( 'keydown', { key: 'Escape', bubbles: true } ) );

afterEach( () => {
	document.body.innerHTML = '';
} );

describe( 'useCloseOnEscape', () => {
	it.each( [
		[ 'a row menu is open elsewhere', '<div role="menu"></div>', null ],
		[ 'a delete warning is open', '<div role="alertdialog"></div>', null ],
		[ 'the resend dialog is still animating out', '<div class="jetpack-send-resend"></div>', null ],
		[
			'the key came from a trigger whose menu is open',
			'<button aria-expanded="true" aria-haspopup="menu">⋮</button>',
			'button',
		],
		[
			'the key came from a filter chip whose popover is open',
			'<div class="dataviews-filters__summary-chip" role="button" aria-expanded="true">Status</div>',
			'[role="button"]',
		],
		[ 'the key came from inside a popover', '<div role="dialog"><input /></div>', 'input' ],
	] )( 'leaves the panel open when %s', ( _, html, targetSelector ) => {
		const onClose = jest.fn();
		renderHook( () => useCloseOnEscape( onClose ) );
		add( html );

		pressEscape( ( targetSelector && document.querySelector( targetSelector ) ) || document.body );

		expect( onClose ).not.toHaveBeenCalled();
	} );

	it( 'closes while the admin bar’s menus, which are always in the page, are there', () => {
		const onClose = jest.fn();
		renderHook( () => useCloseOnEscape( onClose ) );
		add( '<div id="wpadminbar"><ul role="menu"><li>Site</li></ul></div>' );

		pressEscape();

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [
		[ 'a button', '<button aria-expanded="true">Technical details</button>' ],
		[
			'a card header',
			'<div role="button" tabindex="0" aria-expanded="true">Technical details</div>',
		],
	] )( 'closes from an open disclosure, which has no popup of its own (%s)', ( _, html ) => {
		const onClose = jest.fn();
		renderHook( () => useCloseOnEscape( onClose ) );
		const header = add( html );

		pressEscape( header );

		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'lets Escape clear the search box first, then close the panel', () => {
		const onClose = jest.fn();
		renderHook( () => useCloseOnEscape( onClose ) );
		const search = add( '<input type="search" value="order" />' ) as HTMLInputElement;

		pressEscape( search );
		expect( onClose ).not.toHaveBeenCalled();

		search.value = '';
		pressEscape( search );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'leaves the panel open when a menu closes on the same key before it bubbles up', () => {
		const onClose = jest.fn();
		renderHook( () => useCloseOnEscape( onClose ) );
		const trigger = add( '<button aria-expanded="true" aria-haspopup="menu">⋮</button>' );
		const menu = add( '<div role="menu"></div>' );
		// Like a menu that closes on Escape itself, before the document hears the key.
		trigger.addEventListener( 'keydown', () => {
			trigger.setAttribute( 'aria-expanded', 'false' );
			menu.remove();
		} );

		pressEscape( trigger );

		expect( onClose ).not.toHaveBeenCalled();
	} );
} );
