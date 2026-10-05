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
} );
