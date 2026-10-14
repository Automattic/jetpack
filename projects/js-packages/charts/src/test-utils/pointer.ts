import { fireEvent, screen } from '@testing-library/react';

/**
 * Drops the SVG transform jsdom lacks, so visx reads client coordinates as plot coordinates.
 * Call inside a `describe`; it restores the original after the block.
 */
export function stubScreenTransform() {
	const screenTransform = Object.getOwnPropertyDescriptor( SVGElement.prototype, 'getScreenCTM' );
	beforeAll( () => {
		Object.defineProperty( SVGElement.prototype, 'getScreenCTM', {
			configurable: true,
			value: () => null,
		} );
	} );

	afterAll( () => {
		if ( screenTransform ) {
			Object.defineProperty( SVGElement.prototype, 'getScreenCTM', screenTransform );
		} else {
			Reflect.deleteProperty( SVGElement.prototype, 'getScreenCTM' );
		}
	} );
}

/**
 * Dispatches a pointer event on the chart's visx capture rect.
 *
 * @param type    - Event type, such as `pointermove`.
 * @param clientX - Plot x coordinate.
 * @param clientY - Plot y coordinate.
 */
export function firePointer( type: string, clientX: number, clientY: number ) {
	// visx owns the pointer capture rect and does not expose an attribute prop for it.
	const chart = screen.getByRole( 'application' );
	const target = chart.querySelector( 'svg > rect[fill="transparent"]' );
	fireEvent( target, new MouseEvent( type, { bubbles: true, clientX, clientY } ) );
}
