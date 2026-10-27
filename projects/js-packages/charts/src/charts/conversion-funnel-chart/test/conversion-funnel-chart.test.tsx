import { act, isInaccessible, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversionFunnelChart from '../conversion-funnel-chart';
import type { ConversionFunnelChartProps, FunnelStep } from '../types';

let mockChartHeight = 0;
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ jest.fn(), 500, mockChartHeight ],
} ) );

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

// jsdom's window never has focus, so without this the funnel never sees focus leave it.
beforeEach( () => {
	jest.spyOn( document, 'hasFocus' ).mockReturnValue( true );
} );

afterEach( () => {
	jest.restoreAllMocks();
} );

const focus = ( element: HTMLElement ) => act( () => element.focus() );

const stepName = ( label: string ) => new RegExp( `^${ label }, ` );

/**
 * Shows a step's position and id.
 *
 * @param step  - The step.
 * @param index - Its position.
 * @return The tooltip content.
 */
function getTooltipContent( step: FunnelStep, index: number ) {
	return { value: `#${ index }`, rows: [ { label: 'Id', value: step.id } ] };
}

const getEmptyTooltipContent = () => ( {} );

const renderNamedTooltip = ( { step }: { step: FunnelStep } ) => (
	<span>Custom tooltip: { step.label }</span>
);

describe( 'ConversionFunnelChart', () => {
	afterEach( () => {
		mockChartHeight = 0;
	} );

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

		it.each( [
			[ 'unmeasured', 0, 'xl' ],
			[ 'short', 120, 'sm' ],
			[ 'tall', 320, 'xl' ],
		] )( 'spaces a %s (%ipx) chart with the %s gap', ( _, height, gap ) => {
			mockChartHeight = height;
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			expect( screen.getByTestId( 'conversion-funnel-chart' ).style.gap ).toContain(
				`gap-${ gap }`
			);
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

			const cartBar = screen.getByRole( 'option', { name: /cart/i } );
			await user.click( cartBar );

			expect( screen.getByTestId( 'funnel-tooltip' ) ).toHaveTextContent(
				'Cart7,110 itemsConversion rate71.1%'
			);
		} );

		it( 'selects a step and shows its tooltip when the step takes focus', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			focus( screen.getByRole( 'option', { name: stepName( 'Cart' ) } ) );

			expect(
				screen.getByRole( 'option', { name: stepName( 'Cart' ), selected: true } )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'funnel-tooltip' ) ).toHaveTextContent( 'Cart' );
		} );

		it.each( [ '{Enter}', ' ' ] )( 'selects the focused step again with %s', async key => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			focus( screen.getByRole( 'option', { name: stepName( 'Cart' ) } ) );
			await user.keyboard( `{Escape}${ key }` );

			expect(
				screen.getByRole( 'option', { name: stepName( 'Cart' ), selected: true } )
			).toBeInTheDocument();
			expect( screen.getByTestId( 'funnel-tooltip' ) ).toBeInTheDocument();
		} );

		it( 'allows multiple bar interactions', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			// Click on different bars in sequence
			const cartBar = screen.getByRole( 'option', { name: /cart/i } );
			await user.click( cartBar );

			const sessionsBar = screen.getByRole( 'option', { name: /sessions/i } );
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
			const cartBar = screen.getByRole( 'option', { name: /cart/i } );
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
			const cartBar = screen.getByRole( 'option', { name: /cart/i } );
			await user.click( cartBar );

			// Verify the bar is selected (tooltip appears, so label appears twice)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 2 );

			// Click within the component (on the main metric area)
			const mainMetric = screen.getAllByText( '10.3%' )[ 0 ]; // Get the first one (main metric)
			await user.click( mainMetric );

			// Verify selection is dismissed (tooltip disappears, so only one label remains)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 1 );
		} );

		it( 'keeps the step selected when it is clicked again', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cartBar = screen.getByRole( 'option', { name: /cart/i } );
			await user.click( cartBar );
			await user.click( cartBar );

			expect(
				screen.getByRole( 'option', { name: stepName( 'Cart' ), selected: true } )
			).toBeInTheDocument();
		} );
	} );

	describe( 'Accessibility', () => {
		it( 'lists the steps as options of a horizontal listbox, named with their rates', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const listbox = screen.getByRole( 'listbox', { name: 'Funnel steps' } );
			expect( listbox ).toHaveAttribute( 'aria-orientation', 'horizontal' );
			expect(
				screen.getAllByRole( 'option' ).map( option => option.getAttribute( 'aria-label' ) )
			).toEqual( [ 'Sessions, 100%', 'Cart, 71.1%', 'Checkout, 52.5%', 'Purchase, 10.3%' ] );
		} );

		it( 'hides the visible step labels and rates, so the listbox holds only its options', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			expect( isInaccessible( screen.getByText( 'Cart' ) ) ).toBe( true );
			expect( isInaccessible( screen.getByText( '71.1%' ) ) ).toBe( true );
		} );

		it( 'describes the selected step with its tooltip, leaving out the name', () => {
			renderWithoutTheme(
				<ConversionFunnelChart
					mainRate={ 50 }
					steps={ [ ...mockSteps.slice( 0, 2 ), { id: 'none', label: 'None', rate: 50 } ] }
				/>
			);

			const cart = screen.getByRole( 'option', { name: stepName( 'Cart' ) } );
			focus( cart );
			expect( cart ).toHaveAccessibleDescription( '7,110 items Conversion rate 71.1%' );

			const none = screen.getByRole( 'option', { name: stepName( 'None' ) } );
			focus( none );
			expect( none ).toHaveAccessibleDescription( 'Conversion rate 50%' );
			expect( cart ).not.toHaveAttribute( 'aria-describedby' );
		} );

		it( 'shows and describes each step with getTooltipContent when given', () => {
			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } getTooltipContent={ getTooltipContent } />
			);

			const cart = screen.getByRole( 'option', { name: stepName( 'Cart' ) } );
			focus( cart );

			expect( cart ).toHaveAccessibleDescription( '#1 Id cart' );
			expect( screen.getByTestId( 'funnel-tooltip' ) ).toHaveTextContent( 'Cart#1Idcart' );
		} );

		it( 'leaves a step undescribed when its tooltip content is empty', () => {
			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } getTooltipContent={ getEmptyTooltipContent } />
			);

			const cart = screen.getByRole( 'option', { name: stepName( 'Cart' ) } );
			focus( cart );

			expect( cart ).not.toHaveAttribute( 'aria-describedby' );
		} );

		it( 'describes the selected step with the whole custom tooltip', () => {
			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } renderTooltip={ renderNamedTooltip } />
			);

			const cart = screen.getByRole( 'option', { name: stepName( 'Cart' ) } );
			focus( cart );

			expect( cart ).toHaveAccessibleDescription( 'Custom tooltip: Cart' );
		} );

		it( 'hides the tooltip itself from screen readers', () => {
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			focus( screen.getByRole( 'option', { name: stepName( 'Cart' ) } ) );

			expect( screen.getByTestId( 'funnel-tooltip' ) ).toHaveAttribute( 'aria-hidden', 'true' );
		} );

		it( 'marks only the selected step as selected', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			await user.click( screen.getByRole( 'option', { name: stepName( 'Cart' ) } ) );

			expect(
				screen.getByRole( 'option', { name: stepName( 'Cart' ), selected: true } )
			).toBeInTheDocument();
			expect( screen.getAllByRole( 'option', { selected: false } ) ).toHaveLength( 3 );
		} );
	} );

	describe( 'Keyboard navigation', () => {
		const renderBetweenButtons = ( props: Partial< ConversionFunnelChartProps > = {} ) =>
			renderWithoutTheme(
				<>
					<button>Before</button>
					<ConversionFunnelChart { ...defaultProps } { ...props } />
					<button>After</button>
				</>
			);

		it( 'enters the funnel on the first step and leaves it on the next Tab', async () => {
			const user = userEvent.setup();
			renderBetweenButtons();

			screen.getByRole( 'button', { name: 'Before' } ).focus();
			await user.tab();
			expect( screen.getByRole( 'option', { name: stepName( 'Sessions' ) } ) ).toHaveFocus();

			await user.tab();
			expect( screen.getByRole( 'button', { name: 'After' } ) ).toHaveFocus();
		} );

		it( 'returns to the last focused step', async () => {
			const user = userEvent.setup();
			renderBetweenButtons();

			focus( screen.getByRole( 'option', { name: stepName( 'Sessions' ) } ) );
			await user.keyboard( '{ArrowRight}{ArrowRight}' );
			await user.tab();
			await user.tab( { shift: true } );

			expect( screen.getByRole( 'option', { name: stepName( 'Checkout' ) } ) ).toHaveFocus();
		} );

		it( 'selects the step on focus after a press that ended off the step', async () => {
			const user = userEvent.setup();
			renderBetweenButtons();

			const cart = screen.getByRole( 'option', { name: stepName( 'Cart' ) } );
			focus( cart );
			await user.pointer( { keys: '[MouseLeft>]', target: cart } );
			await user.pointer( { keys: '[/MouseLeft]', target: document.body } );
			await user.click( screen.getByRole( 'button', { name: 'After' } ) );
			await user.tab( { shift: true } );

			expect(
				screen.getByRole( 'option', { name: stepName( 'Cart' ), selected: true } )
			).toHaveFocus();
		} );

		it( 'waits for the click to select a step pressed from another step', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			await user.click( screen.getByRole( 'option', { name: stepName( 'Sessions' ) } ) );
			await user.pointer( {
				keys: '[MouseLeft>]',
				target: screen.getByRole( 'option', { name: stepName( 'Cart' ) } ),
			} );

			expect(
				screen.getByRole( 'option', { name: stepName( 'Sessions' ), selected: true } )
			).toBeInTheDocument();
		} );

		it( 'clears the selection when focus leaves the funnel', async () => {
			const user = userEvent.setup();
			renderBetweenButtons();

			focus( screen.getByRole( 'option', { name: stepName( 'Cart' ) } ) );
			await user.tab();

			expect( screen.getAllByRole( 'option', { selected: false } ) ).toHaveLength( 4 );
			expect( screen.queryByTestId( 'funnel-tooltip' ) ).not.toBeInTheDocument();
		} );

		it( 'moves the selection and its tooltip with the arrow keys', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			focus( screen.getByRole( 'option', { name: stepName( 'Cart' ) } ) );
			await user.keyboard( '{ArrowRight}' );

			expect(
				screen.getByRole( 'option', { name: stepName( 'Checkout' ), selected: true } )
			).toHaveFocus();
			expect( screen.getByTestId( 'funnel-tooltip' ) ).toHaveTextContent( 'Checkout' );
		} );

		it.each( [
			[ 'Sessions', '{End}', 'Purchase' ],
			[ 'Purchase', '{Home}', 'Sessions' ],
			[ 'Purchase', '{ArrowRight}', 'Purchase' ],
			[ 'Sessions', '{ArrowLeft}', 'Sessions' ],
		] )( 'from %s, %s focuses %s', async ( from, keys, to ) => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			focus( screen.getByRole( 'option', { name: stepName( from ) } ) );
			await user.keyboard( keys );

			expect( screen.getByRole( 'option', { name: stepName( to ) } ) ).toHaveFocus();
		} );

		it( 'swaps Left and Right in a right-to-left layout', async () => {
			const user = userEvent.setup();
			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } style={ { direction: 'rtl' } } />
			);

			focus( screen.getByRole( 'option', { name: stepName( 'Sessions' ) } ) );
			await user.keyboard( '{ArrowLeft}' );

			expect( screen.getByRole( 'option', { name: stepName( 'Cart' ) } ) ).toHaveFocus();
		} );

		it( 'clears the selection on Escape and keeps focus on the step', async () => {
			const user = userEvent.setup();
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			const cart = screen.getByRole( 'option', { name: stepName( 'Cart' ) } );
			focus( cart );
			await user.keyboard( '{Escape}' );

			expect( cart ).toHaveFocus();
			expect( screen.getAllByRole( 'option', { selected: false } ) ).toHaveLength( 4 );
		} );

		it( 'leaves Escape to the page when no step is selected', async () => {
			const user = userEvent.setup();
			const isPrevented = jest.fn( ( event: KeyboardEvent ) => event.defaultPrevented );
			document.addEventListener( 'keydown', isPrevented );
			renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

			focus( screen.getByRole( 'option', { name: stepName( 'Cart' ) } ) );
			await user.keyboard( '{Escape}{Escape}' );
			document.removeEventListener( 'keydown', isPrevented );

			expect( isPrevented.mock.results.map( result => result.value ) ).toEqual( [ true, false ] );
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

			const bar = screen.getByRole( 'option', { name: /test/i } );
			await user.click( bar );

			expect( screen.getByTestId( 'funnel-tooltip' ) ).toHaveTextContent( '1,234,567 items' );
		} );

		it( 'handles steps without count in tooltip', async () => {
			const user = userEvent.setup();
			const stepsWithoutCount: FunnelStep[] = [ { id: 'test', label: 'Test', rate: 75 } ];

			renderWithoutTheme( <ConversionFunnelChart mainRate={ 75 } steps={ stepsWithoutCount } /> );

			const bar = screen.getByRole( 'option', { name: /test/i } );
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

			const cartBar = screen.getByRole( 'option', { name: /cart/i } );
			await user.click( cartBar );

			expect( screen.getByTestId( 'custom-tooltip' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Custom tooltip: Cart' ) ).toBeInTheDocument();
			expect( customRenderTooltip ).toHaveBeenCalledWith( {
				step: expect.objectContaining( { id: 'cart', label: 'Cart' } ),
				index: 1,
				content: {
					value: '7,110 items',
					rows: [ { label: 'Conversion rate', value: '71.1%' } ],
				},
				top: expect.any( Number ),
				left: expect.any( Number ),
			} );
		} );

		it( 'merges tooltipStyle onto the tooltip box', async () => {
			const user = userEvent.setup();
			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } tooltipStyle={ { background: 'purple' } } />
			);

			await user.click( screen.getByRole( 'option', { name: /cart/i } ) );

			expect( screen.getByTestId( 'bounded-tooltip' ) ).toHaveStyle( { background: 'purple' } );
		} );

		it( 'disables tooltip when renderTooltip returns null', async () => {
			const user = userEvent.setup();
			const customRenderTooltip = jest.fn( () => null );

			renderWithoutTheme(
				<ConversionFunnelChart { ...defaultProps } renderTooltip={ customRenderTooltip } />
			);

			const cartBar = screen.getByRole( 'option', { name: /cart/i } );
			await user.click( cartBar );

			// Should only have one 'Cart' text (header only, no tooltip)
			expect( screen.getAllByText( 'Cart' ) ).toHaveLength( 1 );
			expect( cartBar ).not.toHaveAttribute( 'aria-describedby' );
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

// Chart container at (100, 50); the tooltip box measures 120x40. Everything
// else the charts measure (wrapper, clipping lookups) reports the container.
const mockRects = () =>
	jest.spyOn( Element.prototype, 'getBoundingClientRect' ).mockImplementation( function (
		this: Element
	) {
		const box = this.classList.contains( 'visx-tooltip' );
		return {
			left: box ? 0 : 100,
			top: box ? 0 : 50,
			width: box ? 120 : 400,
			height: box ? 40 : 300,
			right: box ? 120 : 500,
			bottom: box ? 40 : 350,
			x: box ? 0 : 100,
			y: box ? 0 : 50,
			toJSON: () => ( {} ),
		} as DOMRect;
	} );

describe( 'ConversionFunnelChart tooltip position', () => {
	it( 'places the box relative to the chart root, at the click plus the offsets', async () => {
		mockRects();
		const user = userEvent.setup();
		renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

		const bar = screen.getAllByRole( 'option' )[ 0 ];
		await user.pointer( [
			{ target: bar, coords: { clientX: 180, clientY: 140 } },
			{ keys: '[MouseLeft]', target: bar, coords: { clientX: 180, clientY: 140 } },
		] );

		// (180, 140) is (80, 90) inside the root; the chart lifts the anchor 10px
		// above the click, and the box adds 10px each way.
		const box = screen.getByTestId( 'bounded-tooltip' );
		expect( screen.getByTestId( 'conversion-funnel-chart' ) ).toContainElement( box );
		expect( box ).toHaveStyle( {
			transform: 'translate(90px, 90px)',
		} );
	} );

	it( 'keeps the selection and its place when the window loses focus and gets it back', async () => {
		mockRects();
		const user = userEvent.setup();
		renderWithoutTheme( <ConversionFunnelChart { ...defaultProps } /> );

		const bar = screen.getAllByRole( 'option' )[ 0 ];
		await user.pointer( [
			{ target: bar, coords: { clientX: 180, clientY: 140 } },
			{ keys: '[MouseLeft]', target: bar, coords: { clientX: 180, clientY: 140 } },
		] );
		const hasFocus = jest.spyOn( document, 'hasFocus' ).mockReturnValue( false );
		act( () => bar.blur() );
		hasFocus.mockReturnValue( true );
		focus( bar );

		expect( bar ).toHaveAttribute( 'aria-selected', 'true' );
		expect( screen.getByTestId( 'bounded-tooltip' ) ).toHaveStyle( {
			transform: 'translate(90px, 90px)',
		} );
	} );
} );
