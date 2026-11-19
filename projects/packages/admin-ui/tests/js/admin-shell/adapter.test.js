import { isolateRouters, renameBootStore } from '../../../src/admin-shell/adapter';

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

describe( 'renameBootStore', () => {
	const unlock = 'warn(`…will break in the next version of WordPress.`,`@wordpress/boot`)';

	it.each( [
		[ 'esbuild', `const n="wordpress/boot",s=createReduxStore(n);${ unlock }` ],
		[
			'rolldown (Gutenberg plugin)',
			`const Hl=\`wordpress/boot\`,Ul=createReduxStore(Hl);${ unlock }`,
		],
		[ 'unminified (single-quoted)', `const n='wordpress/boot';${ unlock }` ],
	] )( 'renames the store in a %s build and leaves the module id alone', ( _, source ) => {
		const renamed = renameBootStore( source, 'jetpack-forms' );
		expect( renamed ).toContain( '"wordpress/boot--jetpack-forms"' );
		expect( renamed ).not.toMatch( /["'`]wordpress\/boot["'`]/ );
		expect( renamed ).toContain( '`@wordpress/boot`' );
	} );

	it.each( [
		[ 'missing', `const n="wordpress/booted";${ unlock }` ],
		[ 'named twice', `const a="wordpress/boot",b=\`wordpress/boot\`;${ unlock }` ],
	] )( 'refuses a build whose store name is %s', ( _, source ) => {
		expect( () => renameBootStore( source, 'jetpack-forms' ) ).toThrow( 'exactly once' );
	} );
} );
