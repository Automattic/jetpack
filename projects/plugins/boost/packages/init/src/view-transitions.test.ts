import { handleSkippedViewTransitions } from './view-transitions';

const original = document.startViewTransition;

afterEach( () => {
	document.startViewTransition = original;
} );

it( 'preserves navigation and handles the ready rejection when a redirect skips a transition', async () => {
	const ready = Promise.reject( new DOMException( 'Skipped transition', 'AbortError' ) );
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
	new DOMException( 'Transition was skipped. New ViewTransition started', 'InvalidStateError' ),
] )( 'does not create a rejection when the caller handles an update failure: %s', async error => {
	const ready = Promise.reject( error );
	const caught = jest.spyOn( ready, 'catch' );
	const transition = {
		ready,
		finished: Promise.reject( error ),
		updateCallbackDone: Promise.reject( error ),
	};
	const start = jest.fn().mockReturnValue( transition );
	document.startViewTransition = start;
	handleSkippedViewTransitions();

	document.startViewTransition();

	await Promise.all(
		[ ready, transition.finished, transition.updateCallbackDone ].map( promise =>
			expect( promise ).rejects.toBe( error )
		)
	);
	await expect( caught.mock.results[ 0 ].value ).resolves.toBe( error );
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

it( 'installs only once', () => {
	Object.defineProperty( document, 'startViewTransition', {
		configurable: true,
		writable: true,
		value: jest.fn(),
	} );
	handleSkippedViewTransitions();
	const wrapped = document.startViewTransition;
	handleSkippedViewTransitions();
	expect( document.startViewTransition ).toBe( wrapped );
} );
