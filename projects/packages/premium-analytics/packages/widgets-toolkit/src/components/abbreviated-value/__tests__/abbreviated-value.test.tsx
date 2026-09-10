/**
 * External dependencies
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { AbbreviatedText, AbbreviatedValue } from '../abbreviated-value';

const COMPACT = { type: 'number' as const, options: { useMultipliers: true } };

describe( 'AbbreviatedValue', () => {
	it( 'shows the compact figure and reads the exact one to assistive tech', () => {
		render( <AbbreviatedValue value={ 18432 } dataFormat={ COMPACT } /> );

		expect( screen.getByText( '18.4K' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByText( '18,432' ) ).toBeInTheDocument();
	} );

	it( 'spells the exact figure out in a tooltip on hover', async () => {
		const user = userEvent.setup();
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
		const user = userEvent.setup();
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

	it( 'formats currency through the same rule', () => {
		render(
			<AbbreviatedValue
				value={ 19208.05 }
				dataFormat={ { type: 'currency', options: COMPACT.options } }
				currencyCode="USD"
			/>
		);

		expect( screen.getByText( '$19.2K' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByText( '$19,208.05' ) ).toBeInTheDocument();
	} );
} );

describe( 'AbbreviatedText', () => {
	it( 'wraps a sentence that carries the shortened figure', () => {
		render( <AbbreviatedText display="167K views" exact="166,900 views" /> );

		expect( screen.getByText( '167K views' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		expect( screen.getByText( '166,900 views' ) ).toBeInTheDocument();
	} );
} );
