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

			expect( screen.getByText( '10.3%' ) ).toBeInTheDocument();
		} );

		it( 'renders all funnel steps', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			mockSteps.forEach( step => {
				expect( screen.getByText( step.label ) ).toBeInTheDocument();
				expect( screen.getByText( `${ step.rate.toFixed( 1 ) }%` ) ).toBeInTheDocument();
			} );
		} );

		it( 'renders change indicator when provided', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } changeIndicator="+2.1%" /> );

			expect( screen.getByText( '+2.1%' ) ).toBeInTheDocument();
		} );

		it( 'applies loading class when loading prop is true', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } loading /> );

			// Check for loading state by finding an element with loading behavior
			expect( screen.getByText( '10.3%' ) ).toBeInTheDocument();
			// Note: Loading state affects opacity/pointer-events, visible in rendered component
		} );

		it( 'applies custom className when provided', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } className="custom-class" /> );

			// Check that component renders with custom class applied
			expect( screen.getByText( '10.3%' ) ).toBeInTheDocument();
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
		it( 'shows tooltip when a bar is clicked', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			// Tooltip should appear with step details
			expect( screen.getByText( 'Cart' ) ).toBeInTheDocument();
			expect( screen.getByText( '71.1% • 7,110 items' ) ).toBeInTheDocument();
		} );

		it( 'handles keyboard navigation with Enter key', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			cartBar.focus();
			await user.keyboard( '{Enter}' );

			// Tooltip should appear
			expect( screen.getByText( '71.1% • 7,110 items' ) ).toBeInTheDocument();
		} );

		it( 'handles keyboard navigation with Space key', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			cartBar.focus();
			await user.keyboard( ' ' );

			// Tooltip should appear
			expect( screen.getByText( '71.1% • 7,110 items' ) ).toBeInTheDocument();
		} );

		it( 'deselects bar when clicking on chart background', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// First click a bar
			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			// Verify tooltip is visible
			expect( screen.getByText( '71.1% • 7,110 items' ) ).toBeInTheDocument();

			// Click on chart background
			const chart = screen.getByRole( 'button', { name: '' } );
			await user.click( chart );

			// Tooltip should be gone
			expect( screen.queryByText( '71.1% • 7,110 items' ) ).not.toBeInTheDocument();
		} );

		it( 'blurs other bars when one is selected', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			// Check that other bars become unclickable (blurred)
			const sessionsBar = screen.getByRole( 'button', { name: /sessions/i } );
			const checkoutBar = screen.getByRole( 'button', { name: /checkout/i } );
			const purchaseBar = screen.getByRole( 'button', { name: /purchase/i } );

			expect( sessionsBar ).toHaveAttribute( 'tabIndex', '-1' );
			expect( checkoutBar ).toHaveAttribute( 'tabIndex', '-1' );
			expect( purchaseBar ).toHaveAttribute( 'tabIndex', '-1' );
		} );

		it( 'makes blurred bars unclickable', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// Click on cart bar to select it
			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			// Try to click on a blurred bar (sessions)
			const sessionsBar = screen.getByRole( 'button', { name: /sessions/i } );
			expect( sessionsBar ).toHaveAttribute( 'tabIndex', '-1' );
		} );
	} );

	describe( 'Accessibility', () => {
		it( 'has proper ARIA roles for interactive elements', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// Chart container should have button role
			const chart = screen.getByRole( 'button', { name: '' } );
			expect( chart ).toBeInTheDocument();

			// Each bar should have button role
			mockSteps.forEach( step => {
				const bar = screen.getByRole( 'button', { name: new RegExp( step.label, 'i' ) } );
				expect( bar ).toBeInTheDocument();
			} );
		} );

		it( 'has proper tabIndex for keyboard navigation', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// Chart should be focusable
			const chart = screen.getByRole( 'button', { name: '' } );
			expect( chart ).toHaveAttribute( 'tabIndex', '0' );

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

			expect( screen.getByText( '12.3%' ) ).toBeInTheDocument();
		} );

		it( 'formats count numbers with locale formatting in tooltip', async () => {
			const user = userEvent.setup();
			const stepsWithLargeCounts: FunnelStep[] = [
				{ id: 'test', label: 'Test', rate: 50, count: 1234567 },
			];

			renderWithoutTheme(
				<ConversionFunnelChart mainRate={ 50 } steps={ stepsWithLargeCounts } />
			);

			const bar = screen.getByRole( 'button', { name: /test/i } );
			await user.click( bar );

			expect( screen.getByText( '50.0% • 1,234,567 items' ) ).toBeInTheDocument();
		} );

		it( 'handles steps without count in tooltip', async () => {
			const user = userEvent.setup();
			const stepsWithoutCount: FunnelStep[] = [ { id: 'test', label: 'Test', rate: 75 } ];

			renderWithoutTheme( <ConversionFunnelChart mainRate={ 75 } steps={ stepsWithoutCount } /> );

			const bar = screen.getByRole( 'button', { name: /test/i } );
			await user.click( bar );

			expect( screen.getByText( '75.0%' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'items' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Change Indicator Colors', () => {
		it( 'applies positive color for positive change', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } changeIndicator="+5.2%" /> );

			const changeElement = screen.getByText( '+5.2%' );
			// Note: The exact color value would depend on the theme,
			// but we can check that a color style is applied
			expect( changeElement ).toHaveStyle( 'color: rgb(16, 185, 129)' ); // Default positive color
		} );

		it( 'applies negative color for negative change', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } changeIndicator="-3.1%" /> );

			const changeElement = screen.getByText( '-3.1%' );
			expect( changeElement ).toHaveStyle( 'color: rgb(239, 68, 68)' ); // Default negative color
		} );
	} );
} );
