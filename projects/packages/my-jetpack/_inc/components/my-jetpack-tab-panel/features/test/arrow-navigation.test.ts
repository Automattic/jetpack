import { getArrowStep } from '../arrow-navigation';

const event = ( key: string, overrides = {} ) => ( {
	key,
	altKey: false,
	ctrlKey: false,
	metaKey: false,
	shiftKey: false,
	target: null,
	...overrides,
} );

describe( 'getArrowStep', () => {
	it( 'steps back on the left arrow and forward on the right', () => {
		expect( getArrowStep( event( 'ArrowLeft' ), false ) ).toBe( 'previous' );
		expect( getArrowStep( event( 'ArrowRight' ), false ) ).toBe( 'next' );
	} );

	it( 'swaps the arrows in RTL', () => {
		expect( getArrowStep( event( 'ArrowLeft' ), true ) ).toBe( 'next' );
		expect( getArrowStep( event( 'ArrowRight' ), true ) ).toBe( 'previous' );
	} );

	it( 'ignores keys that are not the horizontal arrows', () => {
		[ 'ArrowUp', 'ArrowDown', 'Enter', 'a' ].forEach( key => {
			expect( getArrowStep( event( key ), false ) ).toBeNull();
		} );
	} );

	it.each( [ 'altKey', 'ctrlKey', 'metaKey', 'shiftKey' ] )(
		'leaves %s combinations to the browser',
		modifier => {
			expect( getArrowStep( event( 'ArrowLeft', { [ modifier ]: true } ), false ) ).toBeNull();
		}
	);

	it( 'leaves the arrows to a field the user is in', () => {
		const target = {
			closest: ( selector: string ) => ( selector.includes( 'input' ) ? {} : null ),
		};

		expect( getArrowStep( event( 'ArrowRight', { target } ), false ) ).toBeNull();
	} );

	it( 'still steps when the event came from outside a field', () => {
		const target = { closest: () => null };

		expect( getArrowStep( event( 'ArrowRight', { target } ), false ) ).toBe( 'next' );
	} );
} );
