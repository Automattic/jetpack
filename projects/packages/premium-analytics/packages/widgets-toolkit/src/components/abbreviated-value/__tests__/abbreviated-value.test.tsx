/**
 * External dependencies
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { AbbreviatedValue } from '../abbreviated-value';

const COMPACT = { type: 'number' as const, options: { useMultipliers: true } };
const PREFER_EXACT = { ...COMPACT, preferExact: true };
const withOpens = ( exact: string ) => `${ exact } opens`;

describe( 'AbbreviatedValue', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'shows the compact figure and reads the exact one to assistive tech', () => {
		render( <AbbreviatedValue value={ 18432 } dataFormat={ COMPACT } /> );

		expect( screen.getByText( '18.4K' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByText( '18,432' ) ).toBeInTheDocument();
	} );

	it( 'spells the exact figure out in a tooltip on hover', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render( <AbbreviatedValue value={ 18432 } dataFormat={ COMPACT } /> );

		await user.hover( screen.getByText( '18.4K' ) );

		await expect(
			screen.findByRole( 'tooltip', undefined, { timeout: 3000 } )
		).resolves.toHaveTextContent( '18,432' );
	} );

	it( 'renders a plain value when nothing was shortened', () => {
		render( <AbbreviatedValue value={ 432 } dataFormat={ COMPACT } className="plain" /> );

		const value = screen.getByText( '432' );
		expect( value ).toHaveClass( 'plain' );
		expect( value ).not.toHaveAttribute( 'aria-hidden' );
		expect( screen.queryByText( '432', { selector: '[aria-hidden]' } ) ).not.toBeInTheDocument();
	} );

	it( 'stays out of the tab order, so it can sit inside a row button', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render(
			<button>
				<AbbreviatedValue value={ 18432 } dataFormat={ COMPACT } />
			</button>
		);

		const button = screen.getByRole( 'button' );
		expect( within( button ).getByText( '18,432' ) ).toBeInTheDocument();
		await user.tab();
		expect( button ).toHaveFocus();
		await user.tab();
		// Focus left the button entirely rather than stopping on the value inside it.
		expect( button.ownerDocument.body ).toHaveFocus();
	} );

	it( 'restores a labelled figure in place of the bare one', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render(
			<AbbreviatedValue value={ 18432 } dataFormat={ COMPACT } formatRestored={ withOpens } />
		);

		expect( screen.getByText( '18,432 opens' ) ).toBeInTheDocument();
		expect( screen.queryByText( '18,432' ) ).not.toBeInTheDocument();

		await user.hover( screen.getByText( '18.4K' ) );

		await expect(
			screen.findByRole( 'tooltip', undefined, { timeout: 3000 } )
		).resolves.toHaveTextContent( '18,432 opens' );
	} );

	it( 'reads a label to assistive tech without a tooltip when nothing was shortened', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render(
			<AbbreviatedValue value={ 432 } dataFormat={ COMPACT } formatRestored={ withOpens } />
		);

		expect( screen.getByText( '432' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByText( '432 opens' ) ).toBeInTheDocument();

		await user.hover( screen.getByText( '432' ) );
		act( () => jest.advanceTimersByTime( 3000 ) );

		expect( screen.queryByRole( 'tooltip' ) ).not.toBeInTheDocument();
	} );

	it( 'reads the currency from the data format when no prop overrides it', () => {
		render(
			<AbbreviatedValue
				value={ 1500 }
				dataFormat={ { type: 'currency', options: { useMultipliers: true, currencyCode: 'EUR' } } }
			/>
		);

		expect( screen.getByText( '€1.5K' ) ).toBeInTheDocument();
		expect( screen.getByText( '€1,500.00' ) ).toBeInTheDocument();
	} );

	it( 'lets the currencyCode prop override the data format', () => {
		render(
			<AbbreviatedValue
				value={ 1500 }
				dataFormat={ { type: 'currency', options: { useMultipliers: true, currencyCode: 'EUR' } } }
				currencyCode="USD"
			/>
		);

		expect( screen.getByText( '$1.5K' ) ).toBeInTheDocument();
		expect( screen.getByText( '$1,500.00' ) ).toBeInTheDocument();
	} );

	describe( 'with preferExact', () => {
		let boxWidth = 0;
		let resize: () => void = () => {};
		const rect = ( left: number, right: number ) => ( { left, right } ) as DOMRect;
		const GlobalResizeObserver = window.ResizeObserver;

		beforeEach( () => {
			boxWidth = 200;
			// The figure is 120px wide; the box is as wide as `boxWidth`.
			jest
				.spyOn( HTMLSpanElement.prototype, 'getBoundingClientRect' )
				.mockImplementation( () => rect( 0, 120 ) );
			jest
				.spyOn( HTMLDivElement.prototype, 'getBoundingClientRect' )
				.mockImplementation( () => rect( 0, boxWidth ) );
			Object.defineProperty( HTMLDivElement.prototype, 'clientWidth', {
				configurable: true,
				get: () => boxWidth,
			} );
			window.ResizeObserver = class {
				constructor( callback: ResizeObserverCallback ) {
					resize = () => callback( [], this );
				}
				observe() {}
				unobserve() {}
				disconnect() {}
			};
		} );

		afterEach( () => {
			jest.restoreAllMocks();
			window.ResizeObserver = GlobalResizeObserver;
			// @ts-expect-error restoring jsdom's own getter.
			delete HTMLDivElement.prototype.clientWidth;
		} );

		it( 'shows the exact figure, and the compact one only while the exact one is clipped', () => {
			render(
				<div style={ { overflowX: 'hidden' } }>
					<AbbreviatedValue value={ 18432 } dataFormat={ PREFER_EXACT } />
				</div>
			);

			expect( screen.getByText( '18,432' ) ).not.toHaveAttribute( 'aria-hidden' );
			expect( screen.queryByText( '18.4K' ) ).not.toBeInTheDocument();

			act( () => {
				boxWidth = 100;
				resize();
			} );

			expect( screen.getByText( '18.4K' ) ).toHaveAttribute( 'aria-hidden', 'true' );
			expect( screen.getByText( '18,432' ) ).toBeInTheDocument();

			act( () => {
				boxWidth = 300;
				resize();
			} );

			expect( screen.getByText( '18,432' ) ).not.toHaveAttribute( 'aria-hidden' );
			expect( screen.queryByText( '18.4K' ) ).not.toBeInTheDocument();
		} );
	} );
} );
