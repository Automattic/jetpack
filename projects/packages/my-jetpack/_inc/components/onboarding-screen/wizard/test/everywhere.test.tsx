import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EverywhereArt } from '../everywhere';

const mockMotion = { fine: true, reduced: false };

jest.mock( '@wordpress/compose', () => ( {
	__esModule: true,
	useMediaQuery: () => mockMotion.fine,
	useReducedMotion: () => mockMotion.reduced,
} ) );

const CENTRE = 'translate(0.00px, 0.00px)';
const offset = ( layer: SVGGElement ) => layer.style.transform;

const setup = () => {
	const { container, unmount } = render( <EverywhereArt /> );
	// The art is aria-hidden SVG, so there is no role or name to find it by.
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
	const scene = container.querySelector( '#ev-scene' ) as SVGSVGElement;
	// eslint-disable-next-line testing-library/no-node-access
	const layer = scene.querySelector( '.ev-par' ) as SVGGElement;

	jest
		.spyOn( scene, 'getBoundingClientRect' )
		.mockReturnValue( { left: 0, top: 0, width: 100, height: 100 } as DOMRect );

	return { user: userEvent.setup(), scene, layer, unmount };
};

beforeEach( () => {
	mockMotion.fine = true;
	mockMotion.reduced = false;
	// Runs the frame at once, and returns 0 so the next move can schedule another.
	jest.spyOn( window, 'requestAnimationFrame' ).mockImplementation( callback => {
		callback( 0 );
		return 0;
	} );
} );

afterEach( () => jest.restoreAllMocks() );

describe( 'The parallax on the site-type art', () => {
	it( 'follows the pointer, and comes back to centre when it leaves', async () => {
		const { user, scene, layer, unmount } = setup();

		await user.pointer( { target: scene, coords: { clientX: 100, clientY: 100 } } );
		expect( offset( layer ) ).not.toBe( CENTRE );

		await user.unhover( scene );
		expect( offset( layer ) ).toBe( CENTRE );

		unmount();
		expect( offset( layer ) ).toBe( '' );
	} );

	it.each( [
		[ 'touch', { fine: false, reduced: false } ],
		[ 'reduced motion', { fine: true, reduced: true } ],
	] )( 'stays still for %s', async ( _label, motion ) => {
		Object.assign( mockMotion, motion );
		const { user, scene, layer } = setup();

		await user.pointer( { target: scene, coords: { clientX: 100, clientY: 100 } } );

		expect( offset( layer ) ).toBe( '' );
	} );
} );
