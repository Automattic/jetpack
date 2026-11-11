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
