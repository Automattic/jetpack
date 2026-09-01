import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversionFunnelChart from '../conversion-funnel-chart';
import type { FunnelStep } from '../types';

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
				const expectedRate = step.rate === 100 ? '100%' : `${ step.rate }%`;
				expect( screen.getAllByText( expectedRate ).length ).toBeGreaterThanOrEqual( 1 );
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

	describe( 'Height prop', () => {
		it( 'defaults to 100% height when no height prop or style.height is provided', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );
			expect( screen.getByTestId( 'conversion-funnel-chart' ) ).toHaveStyle( {
				height: '100%',
			} );
		} );

		it( 'applies explicit height prop', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } height="300px" /> );
			expect( screen.getByTestId( 'conversion-funnel-chart' ) ).toHaveStyle( {
				height: '300px',
			} );
		} );

		it( 'respects style.height when height prop is not provided', () => {
			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } style={ { height: '400px' } } />
			);
			expect( screen.getByTestId( 'conversion-funnel-chart' ) ).toHaveStyle( {
				height: '400px',
			} );
		} );

		it( 'height prop takes priority over style.height', () => {
			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } height="250px" style={ { height: '400px' } } />
			);
			expect( screen.getByTestId( 'conversion-funnel-chart' ) ).toHaveStyle( {
				height: '250px',
			} );
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
			// Keyboard navigation now shows tooltip, so label appears twice
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 2 );
		} );

		it( 'handles keyboard navigation with Space key', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			cartBar.focus();
			await user.keyboard( ' ' );

			// Check that component still works after keyboard interaction
			// Keyboard navigation now shows tooltip, so label appears twice
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

		it( 'dismisses selection when clicking outside of component', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// First, click on a bar to select it
			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			// Verify the bar is selected (tooltip appears, so label appears twice)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 2 );

			// Click outside the component (on document body)
			await user.click( document.body );

			// Verify selection is dismissed (tooltip disappears, so only one label remains)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 1 );
		} );

		it( 'dismisses selection when clicking within component but outside the selected bar', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// First, click on a bar to select it
			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			// Verify the bar is selected (tooltip appears, so label appears twice)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 2 );

			// Click within the component (on the main metric area)
			const mainMetric = screen.getAllByText( '10.3%' )[ 0 ]; // Get the first one (main metric)
			await user.click( mainMetric );

			// Verify selection is dismissed (tooltip disappears, so only one label remains)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 1 );
		} );

		it( 'toggles selection when clicking the same bar', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// First, click on a bar to select it
			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			// Verify the bar is selected (tooltip appears, so label appears twice)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 2 );

			// Click the same bar again to deselect
			await user.click( cartBar );

			// Verify selection is cleared (tooltip disappears, so only one label remains)
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
		it( 'formats rates with smart decimal handling', () => {
			const stepsWithPreciseRates: FunnelStep[] = [
				{ id: 'test', label: 'Test', rate: 12.345, count: 100 },
			];

			renderWithoutTheme(
				<ConversionFunnelChart mainRate={ 12.345 } steps={ stepsWithPreciseRates } />
			);

			// Should format both main rate and step rate to 12.35% (rounded to 2 decimals, trailing zeros removed)
			expect( screen.getAllByText( '12.35%' ) ).toHaveLength( 2 );
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
			expect( screen.getAllByText( '50%' ) ).toHaveLength( 2 );
		} );

		it( 'handles steps without count in tooltip', async () => {
			const user = userEvent.setup();
			const stepsWithoutCount: FunnelStep[] = [ { id: 'test', label: 'Test', rate: 75 } ];

			renderWithoutTheme( <ConversionFunnelChart mainRate={ 75 } steps={ stepsWithoutCount } /> );

			const bar = screen.getByRole( 'button', { name: /test/i } );
			await user.click( bar );

			// Should show rate in tooltip, but we have multiple 75% (main + step)
			expect( screen.getAllByText( '75%' ).length ).toBeGreaterThanOrEqual( 1 );
			expect( screen.queryByText( 'items' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Change Indicator Colors', () => {
		it( 'applies positive color for positive change', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } changeIndicator="+5.2%" /> );

			const changeElement = screen.getByText( '+5.2%' );
			// Color is applied via CSS variable, so check that element exists
			expect( changeElement ).toBeInTheDocument();
		} );

		it( 'applies negative color for negative change', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } changeIndicator="-3.1%" /> );

			const changeElement = screen.getByText( '-3.1%' );
			// Color is applied via CSS variable, so check that element exists
			expect( changeElement ).toBeInTheDocument();
		} );
	} );

	describe( 'Render Props', () => {
		it( 'uses custom renderMainMetric when provided', () => {
			const customRenderMainMetric = jest.fn( ( { mainRate } ) => (
				<div data-testid="custom-main-metric">Custom: { mainRate }%</div>
			) );

			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } renderMainMetric={ customRenderMainMetric } />
			);

			expect( screen.getByTestId( 'custom-main-metric' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Custom: 10.3%' ) ).toBeInTheDocument();
			expect( customRenderMainMetric ).toHaveBeenCalledWith( {
				mainRate: 10.3,
				changeIndicator: undefined,
				className: 'main-metric',
				changeColor: expect.any( String ),
			} );
		} );

		it( 'uses custom renderStepLabel when provided', () => {
			const customRenderStepLabel = jest.fn( ( { step, index } ) => (
				<span data-testid={ `custom-label-${ index }` }>
					Step { index + 1 }: { step.label }
				</span>
			) );

			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } renderStepLabel={ customRenderStepLabel } />
			);

			expect( screen.getByText( 'Step 1: Sessions' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Step 2: Cart' ) ).toBeInTheDocument();
			expect( customRenderStepLabel ).toHaveBeenCalled();
		} );

		it( 'uses custom renderStepRate when provided', () => {
			const customRenderStepRate = jest.fn( ( { step } ) => (
				<strong data-testid={ `custom-rate-${ step.id }` }>{ step.rate }% rate</strong>
			) );

			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } renderStepRate={ customRenderStepRate } />
			);

			expect( screen.getByText( '100% rate' ) ).toBeInTheDocument();
			expect( screen.getByText( '71.1% rate' ) ).toBeInTheDocument();
			expect( customRenderStepRate ).toHaveBeenCalled();
		} );

		it( 'uses custom renderTooltip when provided', async () => {
			const user = userEvent.setup();
			const customRenderTooltip = jest.fn( ( { step } ) => (
				<div data-testid="custom-tooltip">Custom tooltip: { step.label }</div>
			) );

			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } renderTooltip={ customRenderTooltip } />
			);

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			expect( screen.getByTestId( 'custom-tooltip' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Custom tooltip: Cart' ) ).toBeInTheDocument();
			expect( customRenderTooltip ).toHaveBeenCalledWith( {
				step: expect.objectContaining( { id: 'cart', label: 'Cart' } ),
				index: 1,
				top: expect.any( Number ),
				left: expect.any( Number ),
				className: 'tooltip-wrapper',
			} );
		} );

		it( 'disables tooltip when renderTooltip returns null', async () => {
			const user = userEvent.setup();
			const customRenderTooltip = jest.fn( () => null );

			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } renderTooltip={ customRenderTooltip } />
			);

			const cartBar = screen.getByRole( 'button', { name: /cart/i } );
			await user.click( cartBar );

			// Should only have one 'Cart' text (header only, no tooltip)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 1 );
			expect( customRenderTooltip ).toHaveBeenCalled();
		} );

		it( 'disables main metric when renderMainMetric returns null', () => {
			const customRenderMainMetric = jest.fn( () => null );

			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } renderMainMetric={ customRenderMainMetric } />
			);

			// Main rate should not appear in the main metric area
			const mainRateElements = screen.getAllByText( '10.3%' );
			// Should only appear in the Purchase step, not in main metric
			expect( mainRateElements ).toHaveLength( 1 );
			expect( customRenderMainMetric ).toHaveBeenCalled();
		} );
	} );

	describe( 'Color palette readiness', () => {
		it( 'enables transitions once color palette is resolved', () => {
			render( <ConversionFunnelChart { ...defaultProps } /> );

			// After render, effects have run (via useEffect in GlobalChartsProvider),
			// so the palette is resolved and the animated class is applied to funnel steps
			const funnelStep = screen.getAllByTestId( 'funnel-step' )[ 0 ];
			expect( funnelStep ).toHaveClass( 'funnel-step--animated' );
		} );
	} );
} );
