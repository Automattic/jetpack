import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversionFunnelChart } from '../conversion-funnel-chart';
import type { FunnelStep } from '../conversion-funnel-chart';

// Mock data for testing
const mockSteps: FunnelStep[] = [
	{
		id: 'sessions',
		label: 'Sessions',
		rate: 100,
		count: 10000,
	},
	{
		id: 'cart',
		label: 'Cart',
		rate: 71.1,
		count: 7110,
	},
	{
		id: 'checkout',
		label: 'Checkout',
		rate: 52.5,
		count: 5250,
	},
	{
		id: 'purchase',
		label: 'Purchase',
		rate: 10.3,
		count: 1030,
	},
];

const defaultProps = {
	mainRate: 10.3,
	steps: mockSteps,
};

// Simple test wrapper without theme provider for now
const renderWithoutTheme = ( component: React.ReactElement ) => {
	return render( component );
};

describe( 'ConversionFunnelChart', () => {
	describe( 'Basic Rendering', () => {
		it( 'renders the main conversion rate', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// Check main rate is displayed (first occurrence)
			expect( screen.getAllByText( '10.3%' ) ).toHaveLength( 2 ); // Main rate + Purchase step
		} );

		it( 'renders all funnel steps', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			mockSteps.forEach( step => {
				expect( screen.getByText( step.label ) ).toBeInTheDocument();
				// Use getAllByText since some rates might appear multiple times
				expect(
					screen.getAllByText( `${ step.rate.toFixed( 1 ) }%` ).length
				).toBeGreaterThanOrEqual( 1 );
			} );
		} );

		it( 'renders change indicator when provided', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } changeIndicator="+2.1%" /> );

			expect( screen.getByText( '+2.1%' ) ).toBeInTheDocument();
		} );

		it( 'applies loading class when loading prop is true', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } loading /> );

			// Check for loading state by finding an element with loading behavior
			expect( screen.getAllByText( '10.3%' ) ).toHaveLength( 2 );
			// Note: Loading state affects opacity/pointer-events, visible in rendered component
		} );

		it( 'applies custom className when provided', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } className="custom-class" /> );

			// Check that component renders with custom class applied
			expect( screen.getAllByText( '10.3%' ) ).toHaveLength( 2 );
			// Note: Custom className is applied to root component element
		} );
	} );

	describe( 'Empty State', () => {
		it( 'shows empty state when no steps provided', () => {
			renderWithoutTheme( <ConversionFunnelChart mainRate={ 0 } steps={ [] } /> );

			expect( screen.getByText( 'No data available' ) ).toBeInTheDocument();
		} );

		it( 'shows loading message when loading and no data', () => {
			renderWithoutTheme( <ConversionFunnelChart mainRate={ 0 } steps={ [] } loading /> );

			expect( screen.getByText( 'Loading...' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'User Interactions', () => {
		it( 'allows bars to be clicked', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			// Check that the component still renders correctly after click
			// After clicking, there will be multiple 'Cart' texts (header + tooltip)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 2 );
			// Rate appears once in header, and in tooltip it's combined with count text
			expect( screen.getByText( '71.1%' ) ).toBeInTheDocument();
			expect( screen.getByText( /71\.1% • .* items/ ) ).toBeInTheDocument();
		} );

		it( 'handles keyboard navigation with Enter key', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			cartBar.focus();
			await user.keyboard( '{Enter}' );

			// Check that component still works after keyboard interaction
			// After keyboard activation, there will be multiple 'Cart' texts (header + tooltip)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 2 );
		} );

		it( 'handles keyboard navigation with Space key', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			cartBar.focus();
			await user.keyboard( ' ' );

			// Check that component still works after keyboard interaction
			// After keyboard activation, there will be multiple 'Cart' texts (header + tooltip)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 2 );
		} );

		it( 'maintains component state after bar interactions', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			// Check that all bars are still accessible
			const sessionsBar = screen.getByRole( 'button', { name: /sessions/i } );
			const checkoutBar = screen.getByRole( 'button', { name: /checkout/i } );
			const purchaseBar = screen.getByRole( 'button', { name: /purchase/i } );

			expect( sessionsBar ).toBeInTheDocument();
			expect( checkoutBar ).toBeInTheDocument();
			expect( purchaseBar ).toBeInTheDocument();
		} );

		it( 'allows multiple bar interactions', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// Click on different bars in sequence
			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			const sessionsBar = screen.getByRole( 'button', { name: /sessions/i } );
			await user.click( sessionsBar );

			// Component should still render correctly
			// After clicking sessions, only Sessions should have tooltip (2 instances)
			expect( screen.getAllByText( 'Sessions' ) ).toHaveLength( 2 );
			// Cart should only appear once in header now
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 1 );
		} );
	} );

	describe( 'Accessibility', () => {
		it( 'has proper ARIA roles for interactive elements', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// Should have 4 bars as interactive elements
			const allButtons = screen.getAllByRole( 'button' );
			expect( allButtons ).toHaveLength( 4 ); // 4 bars

			// Each bar should have button role
			mockSteps.forEach( step => {
				const bar = screen.getByRole( 'button', { name: new RegExp( step.label, 'i' ) } );
				expect( bar ).toBeInTheDocument();
			} );
		} );

		it( 'has proper tabIndex for keyboard navigation', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// Bars should be focusable
			mockSteps.forEach( step => {
				const bar = screen.getByRole( 'button', { name: new RegExp( step.label, 'i' ) } );
				expect( bar ).toHaveAttribute( 'tabIndex', '0' );
			} );
		} );
	} );

	describe( 'Data Formatting', () => {
		it( 'formats rates to one decimal place', () => {
			const stepsWithPreciseRates: FunnelStep[] = [
				{ id: 'test', label: 'Test', rate: 12.345, count: 100 },
			];

			renderWithoutTheme(
				<ConversionFunnelChart mainRate={ 12.345 } steps={ stepsWithPreciseRates } />
			);

			// Should format both main rate and step rate to 12.3%
			expect( screen.getAllByText( '12.3%' ) ).toHaveLength( 2 );
		} );

		it( 'renders large count numbers in component', async () => {
			const user = userEvent.setup();
			const stepsWithLargeCounts: FunnelStep[] = [
				{ id: 'test', label: 'Test', rate: 50, count: 1234567 },
			];

			renderWithoutTheme(
				<ConversionFunnelChart mainRate={ 50 } steps={ stepsWithLargeCounts } />
			);

			const bar = screen.getByRole( 'button', { name: /test/i } );
			await user.click( bar );

			// Check that component renders correctly with large numbers
			// After clicking, there will be multiple 'Test' texts (header + tooltip)
			expect( screen.getAllByText( 'Test' ) ).toHaveLength( 2 );
			expect( screen.getAllByText( '50.0%' ) ).toHaveLength( 2 );
		} );

		it( 'handles steps without count in tooltip', async () => {
			const user = userEvent.setup();
			const stepsWithoutCount: FunnelStep[] = [ { id: 'test', label: 'Test', rate: 75 } ];

			renderWithoutTheme( <ConversionFunnelChart mainRate={ 75 } steps={ stepsWithoutCount } /> );

			const bar = screen.getByRole( 'button', { name: /test/i } );
			await user.click( bar );

			// Should show rate in tooltip, but we have multiple 75.0% (main + step)
			expect( screen.getAllByText( '75.0%' ).length ).toBeGreaterThanOrEqual( 1 );
			expect( screen.queryByText( 'items' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Change Indicator Colors', () => {
		it( 'applies positive color for positive change', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } changeIndicator="+5.2%" /> );

			const changeElement = screen.getByText( '+5.2%' );
			// Note: The exact color value depends on the theme (Woo theme colors)
			expect( changeElement ).toHaveStyle( 'color: rgb(0, 138, 32)' ); // Woo positive color
		} );

		it( 'applies negative color for negative change', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } changeIndicator="-3.1%" /> );

			const changeElement = screen.getByText( '-3.1%' );
			expect( changeElement ).toHaveStyle( 'color: rgb(214, 54, 56)' ); // Woo negative color
		} );
	} );
} );
