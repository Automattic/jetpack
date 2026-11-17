/* eslint-disable testing-library/no-node-access -- The slot adopts an element it did not render. */
import { render, screen } from '@testing-library/react';
import JitmSlot from '../index.tsx';

describe( 'JitmSlot', () => {
	it( 'holds the element the JITM script looks for', () => {
		render( <JitmSlot /> );

		// `#jp-admin-notices` is the contract with packages/jitm's script, not a style hook.
		expect( screen.getByTestId( 'jp-jitm-slot' ) ).toContainElement(
			document.getElementById( 'jp-admin-notices' )
		);
	} );

	it( 'keeps its own class when given another', () => {
		render( <JitmSlot className="jetpack-backup-jitm-card" /> );
		const slot = screen.getByTestId( 'jp-jitm-slot' );

		expect( slot ).toHaveClass( 'jp-jitm-slot' );
		expect( slot ).toHaveClass( 'jetpack-backup-jitm-card' );
	} );

	it( 'takes the page gutter when inset', () => {
		render( <JitmSlot inset /> );

		expect( screen.getByTestId( 'jp-jitm-slot' ) ).toHaveClass( 'jp-jitm-slot--inset' );
	} );

	it( 'renders empty, so a page with no message shows nothing', () => {
		render( <JitmSlot /> );

		expect( document.getElementById( 'jp-admin-notices' ) ).toBeEmptyDOMElement();
	} );

	it( 'hands a placed card to the next slot after a remount', () => {
		const { unmount } = render( <JitmSlot /> );
		const card = document.createElement( 'div' );
		document.getElementById( 'jp-admin-notices' ).append( card );

		unmount();
		expect( card ).not.toBeVisible();

		render( <JitmSlot /> );

		expect( screen.getByTestId( 'jp-jitm-slot' ) ).toContainElement( card );
		expect( card ).toBeVisible();
		card.remove();
	} );

	it( 'adopts the element a slot from another bundle parked', () => {
		document.getElementById( 'jp-admin-notices' )?.remove();
		const parked = document.createElement( 'div' );
		parked.id = 'jp-admin-notices';
		parked.hidden = true;
		document.body.append( parked );

		render( <JitmSlot /> );

		expect( screen.getByTestId( 'jp-jitm-slot' ) ).toContainElement( parked );
		expect( parked ).toBeVisible();
	} );

	it( 'leaves the element with a slot that mounted before this one unmounted', () => {
		const { unmount } = render( <JitmSlot className="outgoing" /> );
		render( <JitmSlot className="incoming" /> );

		unmount();

		expect( document.querySelector( '.incoming' ) ).toContainElement(
			document.getElementById( 'jp-admin-notices' )
		);
	} );

	const inApp = ( page: string ) => {
		const app = document.createElement( 'section' );
		app.dataset.shellPage = page;
		return { container: document.body.appendChild( app ) };
	};
	const shown = ( page: string ) =>
		window.dispatchEvent(
			new CustomEvent( 'jetpack-admin-shell:page-shown', { detail: { page } } )
		);

	it( 'takes the element back when the admin shell shows its app again', () => {
		render( <JitmSlot className="host" />, inApp( 'host' ) );
		render( <JitmSlot className="guest" />, inApp( 'guest' ) );

		shown( 'guest' );
		expect( document.querySelector( '.guest' ) ).toContainElement(
			document.getElementById( 'jp-admin-notices' )
		);

		shown( 'host' );
		expect( document.querySelector( '.host' ) ).toContainElement(
			document.getElementById( 'jp-admin-notices' )
		);
	} );

	it( 'leaves alone the container another shell app renders itself', () => {
		const other = inApp( 'other' ).container;
		const own = document.createElement( 'div' );
		own.id = 'jp-admin-notices';
		other.append( own );
		render( <JitmSlot className="host" />, inApp( 'host' ) );
		render( <JitmSlot className="guest" />, inApp( 'guest' ) );

		shown( 'guest' );
		shown( 'host' );

		expect( other ).toContainElement( own );
		expect( document.querySelector( '.host #jp-admin-notices' ) ).toBeInTheDocument();
	} );
} );
