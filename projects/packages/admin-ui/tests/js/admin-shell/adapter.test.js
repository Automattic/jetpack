import {
	isolateRouters,
	trackViewTransitions,
	transitionSettled,
} from '../../../src/admin-shell/adapter';

let visible = 'my-jetpack';
let gate;

beforeAll( () => {
	gate = isolateRouters(
		() => visible,
		() => {}
	);
} );

beforeEach( () => {
	visible = 'my-jetpack';
	window.history.replaceState( null, '', '/wp-admin/admin.php?page=my-jetpack' );
} );

// Mount an app the way a router does: listen for popstate and wrap pushState.
const mountRouter = slug => {
	const calls = { popstate: 0, pushState: 0 };
	gate.mount( slug );
	window.addEventListener( 'popstate', () => calls.popstate++ );
	const below = window.history.pushState;
	window.history.pushState = function ( ...args ) {
		calls.pushState++;
		return below.apply( this, args );
	};
	gate.mounted( slug );
	return calls;
};

describe( 'isolateRouters', () => {
	it( 'delivers popstate only to the app on screen', () => {
		const forms = mountRouter( 'jetpack-forms' );

		window.dispatchEvent( new PopStateEvent( 'popstate' ) );
		visible = 'jetpack-forms';
		window.dispatchEvent( new PopStateEvent( 'popstate' ) );

		expect( forms.popstate ).toBe( 1 );
	} );

	it( "drops a hidden app's URL write before the visible app's router sees it", () => {
		const myJetpack = mountRouter( 'my-jetpack' );

		window.history.pushState( null, '', '/wp-admin/admin.php?page=jetpack-forms&p=%2Fforms' );

		expect( location.search ).toBe( '?page=my-jetpack' );
		expect( myJetpack.pushState ).toBe( 0 );
	} );

	it( "skips a hidden app's history wrapper", () => {
		const forms = mountRouter( 'jetpack-forms' );

		window.history.pushState( null, '', '/wp-admin/admin.php?page=my-jetpack&p=%2Ffeatures' );

		expect( location.search ).toBe( '?page=my-jetpack&p=%2Ffeatures' );
		expect( forms.pushState ).toBe( 0 );
	} );

	it( 'gives URLs it pushes the next TanStack history index', () => {
		window.history.replaceState( { __TSR_index: 4 }, '' );

		gate.pushUrl( '/wp-admin/admin.php?page=jetpack-forms' );

		expect( window.history.state ).toMatchObject( { __TSR_index: 5 } );
		expect( window.history.state.key ).toBe( window.history.state.__TSR_key );
	} );

	it( 'replaces the current entry in place, keeping its state', () => {
		window.history.replaceState( { __TSR_index: 4, key: 'k' }, '' );
		const length = window.history.length;

		gate.replaceUrl( '/wp-admin/admin.php?page=jetpack-forms&p=%2Fforms' );

		expect( location.search ).toBe( '?page=jetpack-forms&p=%2Fforms' );
		expect( window.history.state ).toEqual( { __TSR_index: 4, key: 'k' } );
		expect( window.history ).toHaveLength( length );
	} );
} );

describe( 'trackViewTransitions', () => {
	it( 'handles a skipped transition and waits for the running one', async () => {
		let finish;
		const skipped = Promise.reject( new Error( 'Transition was skipped' ) );
		document.startViewTransition = () => ( {
			ready: skipped,
			finished: new Promise( resolve => ( finish = resolve ) ),
		} );
		trackViewTransitions();
		const unhandled = jest.fn();
		process.on( 'unhandledRejection', unhandled );

		document.startViewTransition( () => {} );
		let settled = false;
		transitionSettled( 1000 ).then( () => ( settled = true ) );
		await Promise.resolve();
		expect( settled ).toBe( false );
		finish();
		await new Promise( resolve => setTimeout( resolve, 0 ) );

		expect( settled ).toBe( true );
		expect( unhandled ).not.toHaveBeenCalled();
		process.off( 'unhandledRejection', unhandled );
	} );
} );
