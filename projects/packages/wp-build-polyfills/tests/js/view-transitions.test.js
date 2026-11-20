const assert = require( 'node:assert/strict' );
const { describe, it } = require( 'node:test' );

describe( 'trackViewTransitions', () => {
	it( 'handles a skipped transition, waits for the running one, and wraps only once', async () => {
		let finish;
		let started = 0;
		const unhandled = [];
		const onUnhandled = reason => unhandled.push( reason );
		process.on( 'unhandledRejection', onUnhandled );
		globalThis.document = {
			startViewTransition: () => {
				started++;
				return {
					ready: Promise.reject( new Error( 'Transition was skipped' ) ),
					finished: new Promise( resolve => ( finish = resolve ) ),
				};
			},
		};
		const { trackViewTransitions, transitionSettled } =
			await import( '../../src/js/view-transitions.js' );
		trackViewTransitions();
		const wrapped = document.startViewTransition;
		trackViewTransitions();
		assert.equal( document.startViewTransition, wrapped );

		document.startViewTransition( () => {} );
		let settled = false;
		transitionSettled( 1000 ).then( () => ( settled = true ) );
		await Promise.resolve();
		assert.equal( settled, false );
		finish();
		await new Promise( resolve => setTimeout( resolve, 0 ) );

		assert.equal( settled, true );
		assert.equal( started, 1 );
		assert.deepEqual( unhandled, [] );
		process.off( 'unhandledRejection', onUnhandled );
		delete globalThis.document;
	} );
} );
