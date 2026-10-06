import { getLinkedSectionId, scrollToSection } from '../src/settings/anchors';

/**
 * Stub an element's on-screen box.
 *
 * @param element - Element to stub.
 * @param top     - Top edge.
 * @param bottom  - Bottom edge.
 */
function stubRect( element: Element, top: number, bottom: number ): void {
	jest.spyOn( element, 'getBoundingClientRect' ).mockReturnValue( { top, bottom } as DOMRect );
}

describe( 'scrollToSection', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it.each( [
		[ 'pulls a section out from under the sticky header', 100, [ [ 0, -90 ] ] ],
		[ 'leaves a section already clear of the sticky header', 200, [] ],
	] )( '%s', ( _, sectionTop, scrolls ) => {
		document.body.innerHTML = `
			<div id="scroller" style="overflow-y: auto"><section id="subscriptions"></section></div>
		`;
		const scroller = document.getElementById( 'scroller' ) as HTMLElement;
		const section = document.getElementById( 'subscriptions' ) as HTMLElement;
		Object.defineProperties( scroller, {
			scrollHeight: { value: 2000 },
			clientHeight: { value: 500 },
		} );
		const scrollBy = jest.fn();
		Object.assign( scroller, { scrollBy } );
		const scrollIntoView = jest.fn();
		Object.assign( section, { scrollIntoView } );
		stubRect( section, sectionTop, sectionTop + 300 );

		scrollToSection( 'subscriptions' );

		expect( scrollIntoView ).toHaveBeenCalled();
		expect( section ).toHaveFocus();
		expect( scrollBy.mock.calls ).toEqual( scrolls );
	} );
} );

describe( 'getLinkedSectionId', () => {
	it.each( [
		[ 'the hash', '/wp-admin/admin.php?page=jetpack-newsletter#subscriptions', 'subscriptions' ],
		[
			"the wp-build router's p arg",
			'/wp-admin/admin.php?page=jetpack-newsletter&p=%2F%3Ftab%3Dsettings%23subscriptions',
			'subscriptions',
		],
		[ 'nothing', '/wp-admin/admin.php?page=jetpack-newsletter&p=%2F%3Ftab%3Dsettings', '' ],
	] )( 'reads %s', ( _, url, id ) => {
		window.history.replaceState( null, '', url );

		expect( getLinkedSectionId() ).toBe( id );
	} );
} );

describe( 'scrollToSection focus', () => {
	it.each( [ 'focusout', 'pointerdown' ] )(
		'stops the section taking focus after %s',
		eventType => {
			document.body.innerHTML = '<section id="subscriptions"></section>';
			const section = document.getElementById( 'subscriptions' ) as HTMLElement;
			Object.assign( section, { scrollIntoView: jest.fn() } );
			stubRect( section, 500, 800 );

			scrollToSection( 'subscriptions' );
			section.dispatchEvent( new Event( eventType, { bubbles: true } ) );

			expect( section ).not.toHaveAttribute( 'tabindex' );
			expect( section ).not.toHaveClass( 'newsletter-settings__linked-section' );
		}
	);
} );
