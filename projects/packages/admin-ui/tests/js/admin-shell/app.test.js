// Aliased: testing-library's lint rules treat anything named *render* as its render().
import { createApp, whenRendered as untilHeading } from '../../../src/admin-shell/app';

// In the document: jsdom computes `display: none` for detached elements.
const newApp = () =>
	createApp( 'forms', document.body.appendChild( document.createElement( 'section' ) ) );

describe( 'createApp', () => {
	it( 'starts loading, and a loading app only moves on or off screen', () => {
		const app = newApp();
		app.place( false );

		expect( app.el.dataset ).toMatchObject( { shellPage: 'forms', shellState: 'loading' } );
		expect( app.el ).toHaveStyle( { display: 'none' } );
		expect( app.el.inert ).toBe( true );
		app.place( true );
		expect( app.el.inert ).toBe( false );
	} );

	it.each( [
		[ 'loading', 'visible' ],
		[ 'loading', 'hidden' ],
		[ 'visible', 'ready' ],
	] )( 'refuses %s → %s', ( from, to ) => {
		const app = newApp();
		app.el.dataset.shellState = from;

		expect( () => app.to( to ) ).toThrow( `can't go from ${ from } to ${ to }` );
	} );

	it( 'switches its stylesheets off while hidden and back on when shown', () => {
		const app = newApp();
		const link = document.head.appendChild( document.createElement( 'link' ) );
		app.styles.push( link );
		app.to( 'ready' );
		app.place( false );

		expect( link.disabled ).toBe( true );
		app.place( true );
		expect( link.disabled ).toBe( false );
	} );

	it( 'makes a hidden app inert and gives it back when shown', () => {
		const app = newApp();
		app.to( 'ready' );
		app.place( false );

		expect( app.el.inert ).toBe( true );
		expect( app.el ).toHaveStyle( { display: 'none' } );
		app.place( true );
		expect( app.el.inert ).toBe( false );
		expect( app.el ).not.toHaveStyle( { display: 'none' } );
	} );
} );

describe( 'focusHeading', () => {
	it( 'focuses the first page heading with text, without scrolling to it', () => {
		const app = newApp();
		app.el.innerHTML = '<h1></h1><h1>Forms</h1>';
		const heading = app.el.querySelectorAll( 'h1' )[ 1 ];
		const focus = jest.spyOn( heading, 'focus' );
		app.focusHeading();

		expect( heading ).toHaveFocus();
		expect( heading ).toHaveAttribute( 'tabindex', '-1' );
		expect( focus ).toHaveBeenCalledWith( { preventScroll: true } );
	} );

	it.each( [
		[ 'follows it to the heading a later route renders', false, 'h1' ],
		[ 'leaves focus the user moved elsewhere', true, 'button' ],
	] )( 'when the heading is replaced, %s', async ( _, userMoved, focused ) => {
		const app = newApp();
		app.el.innerHTML = '<button>Other</button><h1>Forms</h1>';
		app.focusHeading();
		if ( userMoved ) {
			app.el.querySelector( 'button' ).focus();
		}
		const next = Object.assign( document.createElement( 'h1' ), { textContent: 'Responses' } );
		app.el.querySelector( 'h1' ).replaceWith( next );
		await new Promise( resolve => setTimeout( resolve ) );

		expect( app.el.querySelector( focused ) ).toHaveFocus();
	} );

	it( 'keeps a heading’s own tabindex', () => {
		const app = newApp();
		app.el.innerHTML = '<h1 tabindex="0">Forms</h1>';
		app.focusHeading();

		expect( app.el.querySelector( 'h1' ) ).toHaveAttribute( 'tabindex', '0' );
	} );
} );

describe( 'whenRendered', () => {
	it( 'resolves once a heading with text is in the app', async () => {
		const el = document.createElement( 'div' );
		const done = untilHeading( el, 1000 );
		el.innerHTML = '<h1></h1>';
		el.querySelector( 'h1' ).textContent = 'Forms';

		await expect( done ).resolves.toBeUndefined();
	} );

	it( 'gives up after the timeout', async () => {
		jest.useFakeTimers();
		const done = untilHeading( document.createElement( 'div' ), 1000 );
		jest.advanceTimersByTime( 1000 );

		await expect( done ).rejects.toThrow( 'did not render in time' );
		jest.useRealTimers();
	} );
} );
