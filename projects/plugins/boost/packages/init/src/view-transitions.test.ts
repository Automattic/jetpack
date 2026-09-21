import { handleSkippedViewTransitions } from './view-transitions';

const original = document.startViewTransition;

afterEach( () => {
	document.startViewTransition = original;
} );

it( 'preserves navigation and handles the ready rejection when a redirect skips a transition', async () => {
	const ready = Promise.reject(
		new DOMException( 'Transition was skipped. New ViewTransition started', 'AbortError' )
	);
	const caught = jest.spyOn( ready, 'catch' );
	const transition = { ready };
	const start = jest.fn().mockReturnValue( transition );
	document.startViewTransition = start;
	handleSkippedViewTransitions();
	const update = jest.fn();

	expect( document.startViewTransition( update ) ).toBe( transition );
	expect( start ).toHaveBeenCalledWith( update );
	expect( start.mock.contexts[ 0 ] ).toBe( document );
	await expect( caught.mock.results[ 0 ].value ).resolves.toBeUndefined();
} );

it.each( [
	new Error( 'Navigation failed' ),
	new DOMException( 'Another abort', 'AbortError' ),
	new DOMException( 'Transition was skipped. New ViewTransition started', 'InvalidStateError' ),
] )( 'preserves unexpected transition errors: %s', async error => {
	const ready = Promise.reject( error );
	const caught = jest.spyOn( ready, 'catch' );
	const start = jest.fn().mockReturnValue( { ready } );
	document.startViewTransition = start;
	handleSkippedViewTransitions();

	document.startViewTransition();

	await expect( caught.mock.results[ 0 ].value ).rejects.toBe( error );
} );

it( 'leaves browsers without View Transitions unchanged', () => {
	Object.defineProperty( document, 'startViewTransition', {
		configurable: true,
		writable: true,
		value: undefined,
	} );
	handleSkippedViewTransitions();
	expect( document.startViewTransition ).toBeUndefined();
} );
