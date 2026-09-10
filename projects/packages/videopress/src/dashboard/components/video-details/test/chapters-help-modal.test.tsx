import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChaptersHelpModal from '../chapters-help-modal';

/**
 * Locate the dialog's scroll/padding container.
 *
 * `Dialog.Content` tags its element with `data-wp-ui-overlay-scroll-container`
 * (see `useOverlayScrollStateAttributes` in `@wordpress/ui`). Asserting against
 * that attribute rather than the hashed CSS module class keeps these tests tied
 * to the behaviour that matters: the body has to sit inside the dialog's scroll
 * container, not directly under `Dialog.Popup`, or it renders without padding
 * and clips instead of scrolling. Testing Library has no query for attributes,
 * hence the direct lookup.
 *
 * @return The dialog body element, or null when no dialog is rendered.
 */
function getDialogBody(): HTMLElement | null {
	return document.querySelector< HTMLElement >( '[data-wp-ui-overlay-scroll-container]' );
}

describe( 'ChaptersHelpModal', () => {
	it( 'renders nothing while closed', () => {
		render( <ChaptersHelpModal isOpen={ false } onClose={ jest.fn() } /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the body inside the dialog content container', () => {
		render( <ChaptersHelpModal isOpen onClose={ jest.fn() } /> );

		const body = getDialogBody();
		expect( body ).toContainElement(
			screen.getByText( /Chapters are a great way to split up longer videos/i )
		);
		expect( body ).toContainElement(
			screen.getByRole( 'heading', {
				name: /How to add Chapters to your VideoPress videos/i,
			} )
		);
		expect( body ).toContainElement( screen.getByRole( 'list' ) );
		expect( body ).toContainElement( screen.getByText( '00:24 Mountains arise' ) );
	} );

	it( 'keeps the header and footer outside the scrolling body', () => {
		render( <ChaptersHelpModal isOpen onClose={ jest.fn() } /> );

		const body = getDialogBody();
		expect( body ).not.toContainElement(
			screen.getByRole( 'heading', { name: 'Chapters in VideoPress' } )
		);
		expect( body ).not.toContainElement( screen.getByRole( 'button', { name: 'Got it, thanks' } ) );
	} );

	it( 'calls onClose when the confirm button is clicked', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		render( <ChaptersHelpModal isOpen onClose={ onClose } /> );

		await user.click( screen.getByRole( 'button', { name: 'Got it, thanks' } ) );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );
} );
