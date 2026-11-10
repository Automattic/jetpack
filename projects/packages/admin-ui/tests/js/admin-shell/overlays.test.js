import {
	closeDialogsOf,
	closeOverlayAround,
	showOverlaysOf,
	trackOverlays,
} from '../../../src/admin-shell/overlays';

let visible = 'my-jetpack';
beforeAll( () => trackOverlays( () => visible ) );
beforeEach( () => {
	visible = 'my-jetpack';
	document.body.innerHTML = '';
} );

// The observer tags on the next microtask.
const addToBody = async html => {
	const el = document.createElement( 'div' );
	el.innerHTML = html;
	document.body.append( el );
	await Promise.resolve();
	return el;
};
const isHidden = el => el.hasAttribute( 'data-shell-overlay-hidden' );

describe( 'overlays', () => {
	it( 'hides a page’s dialog while another page shows, and brings it back', async () => {
		const modal = await addToBody( '<div class="components-modal__screen-overlay"></div>' );

		showOverlaysOf( 'jetpack-forms' );
		expect( isHidden( modal ) ).toBe( true );
		showOverlaysOf( 'my-jetpack' );
		expect( isHidden( modal ) ).toBe( false );
	} );

	it( 'leaves elements that are not overlays alone', async () => {
		const launcher = await addToBody( '<button>Chat with us</button>' );

		showOverlaysOf( 'jetpack-forms' );

		expect( isHidden( launcher ) ).toBe( false );
	} );

	it( 'tags what each page puts in a shared overlay slot, not the slot', async () => {
		const slot = document.createElement( 'div' );
		slot.setAttribute( 'data-wp-compat-overlay-slot', '' );
		document.body.append( slot );
		await Promise.resolve();
		visible = 'jetpack-forms';
		const dialog = document.createElement( 'div' );
		dialog.innerHTML = '<div role="dialog"></div>';
		slot.append( dialog );
		await Promise.resolve();

		showOverlaysOf( 'jetpack-forms' );

		expect( isHidden( slot ) ).toBe( false );
		expect( isHidden( dialog ) ).toBe( false );
	} );

	it( 'closes the overlay a link is in with Escape', async () => {
		const modal = await addToBody( '<div role="dialog"><a href="#">Open</a></div>' );
		const escape = jest.fn( event => {
			if ( event.key === 'Escape' ) {
				window.history.replaceState( null, '', '?page=my-jetpack&p=%2Ffeatures' );
			}
		} );
		modal.addEventListener( 'keydown', escape );

		await expect( closeOverlayAround( modal.querySelector( 'a' ) ) ).resolves.toBe( true );
		expect( escape ).toHaveBeenCalled();
		await expect( closeOverlayAround( document.createElement( 'a' ) ) ).resolves.toBe( false );
	} );

	it( 'closes only the hidden page’s dialogs with Escape', async () => {
		const formsModal = await addToBody( '<div><div role="dialog"></div></div>' );
		visible = 'jetpack-forms';
		const otherModal = await addToBody( '<div role="alertdialog"></div>' );
		const escapes = [];
		document.addEventListener( 'keydown', event => {
			if ( event.key === 'Escape' ) {
				escapes.push( event.target );
			}
		} );

		closeDialogsOf( 'my-jetpack' );

		expect( escapes ).toEqual( [ formsModal.firstChild.firstChild ] );
		expect( otherModal ).toBeInTheDocument();
	} );
} );
