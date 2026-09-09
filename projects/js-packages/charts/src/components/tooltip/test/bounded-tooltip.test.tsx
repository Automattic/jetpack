import { render, screen } from '@testing-library/react';
import { BoundedTooltip, getBoundedPosition } from '../private/bounded-tooltip';

const BOX = { width: 208, height: 36 };
const OFFSETS = { offsetLeft: 10, offsetTop: 10 };

describe( 'getBoundedPosition', () => {
	test( 'sits below and to the right of the anchor when that fits', () => {
		expect(
			getBoundedPosition( {
				left: 40,
				top: 20,
				...OFFSETS,
				box: BOX,
				bounds: { left: 0, top: 0, right: 600, bottom: 300 },
			} )
		).toEqual( { x: 50, y: 30 } );
	} );

	test( 'flips to the other side when the near side clips more', () => {
		expect(
			getBoundedPosition( {
				left: 500,
				top: 280,
				...OFFSETS,
				box: BOX,
				bounds: { left: 0, top: 0, right: 600, bottom: 300 },
			} )
		).toEqual( { x: 282, y: 234 } );
	} );

	test( 'pins the box to the edge when neither side fits, instead of spilling', () => {
		// A 208px box mid-way across a 346px plot: neither side fits, so the box
		// keeps the near side and parks at the right edge instead of spilling.
		expect(
			getBoundedPosition( {
				left: 173,
				top: 50,
				...OFFSETS,
				box: BOX,
				bounds: { left: 0, top: 0, right: 346, bottom: 200 },
			} )
		).toEqual( { x: 138, y: 60 } );
	} );

	test( 'may leave the wrapper as long as it stays inside the clipping ancestor', () => {
		// The wrapper starts 40px inside its clipping card, so the box can reach
		// 40px past the wrapper's left edge, and stops there.
		expect(
			getBoundedPosition( {
				left: 173,
				top: 50,
				...OFFSETS,
				box: BOX,
				bounds: { left: -40, top: -60, right: 360, bottom: 200 },
			} )
		).toEqual( { x: -40, y: 60 } );
	} );
} );

const rect = ( left: number, top: number, width: number, height: number ) =>
	( {
		left,
		top,
		width,
		height,
		right: left + width,
		bottom: top + height,
		x: left,
		y: top,
		toJSON: () => ( {} ),
	} ) as DOMRect;

describe( 'BoundedTooltip', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	test( 'keeps the box inside an overflow-hidden ancestor that is wider than the wrapper', () => {
		// Card at x=400 (400 wide, overflow hidden); plot wrapper at x=440, 346 wide.
		jest.spyOn( Element.prototype, 'getBoundingClientRect' ).mockImplementation( function (
			this: Element
		) {
			if ( this.classList.contains( 'visx-tooltip' ) ) {
				return rect( 0, 0, 208, 36 );
			}
			if ( this.getAttribute( 'data-testid' ) === 'card' ) {
				return rect( 400, 100, 400, 400 );
			}
			return rect( 440, 160, 346, 200 );
		} );

		render(
			<div data-testid="card" style={ { overflow: 'hidden' } }>
				<div style={ { position: 'relative' } }>
					<BoundedTooltip left={ 173 } top={ 50 } data-testid="box">
						content
					</BoundedTooltip>
				</div>
			</div>
		);

		// Neither side of the anchor fits inside the card, so the box stops at
		// the card's left edge, 40px outside the wrapper.
		expect( screen.getByTestId( 'box' ) ).toHaveStyle( { transform: 'translate(-40px, 60px)' } );
	} );

	test( 'falls back to the viewport when nothing clips', () => {
		jest.spyOn( Element.prototype, 'getBoundingClientRect' ).mockImplementation( function (
			this: Element
		) {
			return this.classList.contains( 'visx-tooltip' )
				? rect( 0, 0, 208, 36 )
				: rect( 900, 0, 346, 200 );
		} );

		render(
			<div style={ { position: 'relative' } }>
				<BoundedTooltip left={ 173 } top={ 50 } data-testid="box">
					content
				</BoundedTooltip>
			</div>
		);

		// JSDOM's viewport is 1024px wide and the wrapper starts at 900: the box
		// flips left of the anchor and stops at the viewport's right edge.
		expect( screen.getByTestId( 'box' ) ).toHaveStyle( { transform: 'translate(-84px, 60px)' } );
	} );
} );
