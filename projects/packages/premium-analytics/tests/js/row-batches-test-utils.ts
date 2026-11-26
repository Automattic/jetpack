/* eslint-disable testing-library/no-node-access -- layout is measured off the DOM, not queried. */
import { fireEvent } from '@testing-library/react';

const ROW_HEIGHT = 48;
let scrolledPx = 0;

/**
 * Lay elements out as `useRowBatches` measures them, since jsdom lays nothing out: each one as
 * tall as the table rows inside it, shifted up by how far `scrollRowsToEnd()` scrolled the page.
 */
export function mockRowLayout(): void {
	scrolledPx = 0;
	jest.spyOn( Element.prototype, 'getBoundingClientRect' ).mockImplementation( function (
		this: Element
	) {
		const height = this.querySelectorAll( 'tbody tr' ).length * ROW_HEIGHT;
		const top = -scrolledPx;
		return {
			x: 0,
			y: top,
			top,
			bottom: top + height,
			left: 0,
			right: 0,
			width: 0,
			height,
			toJSON: () => ( {} ),
		};
	} );
	// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no `scrollIntoView` to spy on.
	Element.prototype.scrollIntoView = jest.fn( () => {
		scrolledPx = 0;
	} );
}

/**
 * Scroll the page until the last mounted row sits at the bottom of the window.
 */
export function scrollRowsToEnd(): void {
	const rows = document.querySelectorAll( 'tbody tr' ).length;
	scrolledPx = Math.max( 0, rows * ROW_HEIGHT - window.innerHeight );
	fireEvent.scroll( window );
}
