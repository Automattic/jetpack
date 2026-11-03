import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddToContentMenu from '..';

const GUID = 'abc123';

/**
 * Set (or clear) the boot payload the component reads its nonce from.
 *
 * @param contentNonce - Nonce to expose, or undefined to simulate its absence.
 */
function setInitialState( contentNonce?: string ) {
	( global as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } ).JPVIDEOPRESS_INITIAL_STATE =
		contentNonce === undefined ? { API: {} } : { API: { contentNonce } };
}

describe( 'AddToContentMenu', () => {
	let openSpy: jest.SpyInstance;

	beforeEach( () => {
		setInitialState( 'nonce-123' );
		openSpy = jest.spyOn( window, 'open' ).mockImplementation( () => null );
	} );

	afterEach( () => {
		openSpy.mockRestore();
		delete ( global as unknown as { JPVIDEOPRESS_INITIAL_STATE?: unknown } )
			.JPVIDEOPRESS_INITIAL_STATE;
	} );

	// Both halves of the hand-off have to be present. A menu whose items open a
	// blank editor is worse than no menu, so the component renders nothing
	// rather than something inert.
	it( 'renders nothing without a GUID', () => {
		const { container } = render( <AddToContentMenu /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing without a content nonce', () => {
		setInitialState( undefined );

		const { container } = render( <AddToContentMenu guid={ GUID } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'opens a new post with the video and the nonce', async () => {
		const user = userEvent.setup();
		render( <AddToContentMenu guid={ GUID } /> );

		await user.click( screen.getByRole( 'button', { name: /add to a post or page/i } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'New post' } ) );

		expect( openSpy ).toHaveBeenCalledTimes( 1 );
		const [ url ] = openSpy.mock.calls[ 0 ];
		expect( url ).toContain( 'post-new.php' );
		expect( url ).toContain( `videopress_guid=${ GUID }` );
		expect( url ).toContain( '_wpnonce=nonce-123' );
		// The post branch must not carry a post_type, or it would create a page.
		expect( url ).not.toContain( 'post_type' );
	} );

	// `post_type=page` works only because the server filters `default_content`
	// on post-new.php, which serves both types — worth pinning.
	it( 'opens a new page when the page item is chosen', async () => {
		const user = userEvent.setup();
		render( <AddToContentMenu guid={ GUID } /> );

		await user.click( screen.getByRole( 'button', { name: /add to a post or page/i } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'New page' } ) );

		const [ url ] = openSpy.mock.calls[ 0 ];
		expect( url ).toContain( 'post_type=page' );
		expect( url ).toContain( `videopress_guid=${ GUID }` );
	} );
} );
