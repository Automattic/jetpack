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
afterEach( () => jest.useRealTimers() );

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

	it( 'closes only the hidden page’s dialogs with Escape, and waits for them to go', async () => {
		const formsModal = await addToBody( '<div><div role="dialog"></div></div>' );
		const dialog = formsModal.querySelector( '[role="dialog"]' );
		visible = 'jetpack-forms';
		const otherModal = await addToBody( '<div role="alertdialog"></div>' );
		const escapes = [];
		const onKey = event => {
			if ( event.key === 'Escape' ) {
				escapes.push( event.target );
				setTimeout( () => event.target.remove(), 50 );
			}
		};
		document.addEventListener( 'keydown', onKey );

		const closed = closeDialogsOf( 'my-jetpack' );
		const gone = jest.fn();
		closed.then( gone );
		await new Promise( resolve => setTimeout( resolve ) );
		expect( gone ).not.toHaveBeenCalled();
		await closed;

		document.removeEventListener( 'keydown', onKey );
		expect( escapes ).toEqual( [ dialog ] );
		expect( dialog ).not.toBeInTheDocument();
		expect( otherModal ).toBeInTheDocument();
	} );

	const animatingOut = dialog => dialog.parentElement.classList.add( 'is-animating-out' );
	const endingStyle = dialog => dialog.setAttribute( 'data-ending-style', '' );

	it.each( [
		[ 'a slow exit of a @wordpress/components dialog', animatingOut, 800, 800 ],
		[ 'a slow exit of a @wordpress/ui dialog', endingStyle, 800, 800 ],
		[ 'a dialog stuck closing, up to the cap', animatingOut, null, 5000 ],
	] )( 'waits out %s', async ( _, startClosing, exitAfter, settlesAt ) => {
		const modal = await addToBody( '<div><div role="dialog"></div></div>' );
		modal.addEventListener( 'keydown', event => {
			startClosing( event.target );
			if ( exitAfter ) {
				setTimeout( () => modal.remove(), exitAfter );
			}
		} );
		jest.useFakeTimers();

		const gone = jest.fn();
		closeDialogsOf( 'my-jetpack' ).then( gone );
		await jest.advanceTimersByTimeAsync( settlesAt - 100 );
		expect( gone ).not.toHaveBeenCalled();
		await jest.advanceTimersByTimeAsync( 200 );

		expect( gone ).toHaveBeenCalled();
	} );

	it( 'does not press Escape again on a dialog a link already closed', async () => {
		const modal = await addToBody( '<div role="dialog"><a href="#">Open</a></div>' );
		// Still in the document while it animates out, as when the switch reaches it.
		const escape = jest.fn( () => setTimeout( () => modal.remove(), 150 ) );
		modal.addEventListener( 'keydown', escape );

		await closeOverlayAround( modal.querySelector( 'a' ) );
		await closeDialogsOf( 'my-jetpack' );

		expect( escape ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'presses Escape again on a dialog that stayed open the last time', async () => {
		const modal = await addToBody( '<div role="dialog"></div>' );
		const escape = jest.fn();
		modal.addEventListener( 'keydown', escape );
		jest.useFakeTimers();

		const first = closeDialogsOf( 'my-jetpack' );
		await jest.advanceTimersByTimeAsync( 1000 );
		await first;
		closeDialogsOf( 'my-jetpack' );
		jest.useRealTimers();

		expect( escape ).toHaveBeenCalledTimes( 2 );
	} );
} );
