import { render, screen } from '@testing-library/react';
import { useViewportClamp } from '../use-viewport-clamp';

/**
 * Minimal consumer of the hook used to assert the applied style.
 *
 * @return A div wired to the hook's ref and style.
 */
function Harness() {
	const { ref, style } = useViewportClamp< HTMLDivElement >();
	return (
		<div data-testid="tip" ref={ ref } style={ style }>
			content
		</div>
	);
}

/**
 * Forces `getBoundingClientRect` to report a fixed rect so JSDOM (which has no
 * layout) can exercise the clamping math.
 *
 * @param rect - Partial rect overriding the zeroed JSDOM default.
 * @return The jest spy, so the caller can restore it.
 */
function mockRect( rect: Partial< DOMRect > ) {
	return jest.spyOn( Element.prototype, 'getBoundingClientRect' ).mockReturnValue( {
		width: 0,
		height: 0,
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		x: 0,
		y: 0,
		toJSON: () => ( {} ),
		...rect,
	} as DOMRect );
}

describe( 'useViewportClamp', () => {
	const originalInnerWidth = window.innerWidth;
	let rectSpy: jest.SpyInstance | undefined;

	const setInnerWidth = ( width: number ) =>
		Object.defineProperty( window, 'innerWidth', {
			configurable: true,
			value: width,
		} );

	afterEach( () => {
		rectSpy?.mockRestore();
		rectSpy = undefined;
		setInnerWidth( originalInnerWidth );
	} );

	test( 'applies no transform when the tooltip fits within the viewport', () => {
		setInnerWidth( 500 );
		rectSpy = mockRect( { left: 50, width: 200, right: 250 } );

		render( <Harness /> );

		expect( screen.getByTestId( 'tip' ) ).not.toHaveAttribute( 'style' );
	} );

	test( 'shifts left when the tooltip overflows the right viewport edge', () => {
		setInnerWidth( 500 );
		// Right edge at 600, viewport edge (with 16px padding) at 484 → overflow 116.
		rectSpy = mockRect( { left: 400, width: 200, right: 600 } );

		render( <Harness /> );

		expect( screen.getByTestId( 'tip' ) ).toHaveStyle( { transform: 'translateX(-116px)' } );
	} );

	test( 'never pulls the left edge past the opposite padding for an over-wide tooltip', () => {
		setInnerWidth( 300 );
		// Tooltip wider than the available space; left edge should land on the padding (16px).
		rectSpy = mockRect( { left: 120, width: 400, right: 520 } );

		render( <Harness /> );

		// naturalLeft 120 → shift to 16px padding = -(120 - 16) = -104.
		expect( screen.getByTestId( 'tip' ) ).toHaveStyle( { transform: 'translateX(-104px)' } );
	} );
} );
