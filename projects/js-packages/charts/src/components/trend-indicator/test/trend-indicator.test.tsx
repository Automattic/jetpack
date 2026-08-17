import { render, screen } from '@testing-library/react';
import { GlobalChartsProvider } from '../../../providers/chart-context/global-charts-provider';
import { CHART_SCOPE_CLASS } from '../../../styles/chart-scope-class';
import { TrendIndicator } from '../trend-indicator';

describe( 'TrendIndicator', () => {
	it( 'renders up trend with value', () => {
		render( <TrendIndicator direction="up" value="+14%" /> );

		expect( screen.getByText( '+14%' ) ).toBeInTheDocument();
	} );

	it( 'renders down trend with value', () => {
		render( <TrendIndicator direction="down" value="-5%" /> );

		expect( screen.getByText( '-5%' ) ).toBeInTheDocument();
	} );

	it( 'renders neutral trend with value', () => {
		render( <TrendIndicator direction="neutral" value="0%" /> );

		expect( screen.getByText( '0%' ) ).toBeInTheDocument();
	} );

	it( 'renders icon for up direction', () => {
		const { container } = render( <TrendIndicator direction="up" value="+10%" /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const svg = container.querySelector( 'svg' );
		expect( svg ).toBeInTheDocument();
		expect( svg ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'renders icon for down direction', () => {
		const { container } = render( <TrendIndicator direction="down" value="-10%" /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const svg = container.querySelector( 'svg' );
		expect( svg ).toBeInTheDocument();
		expect( svg ).toHaveAttribute( 'aria-hidden', 'true' );
	} );

	it( 'does not render icon for neutral direction', () => {
		const { container } = render( <TrendIndicator direction="neutral" value="0%" /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'svg' ) ).not.toBeInTheDocument();
	} );

	it( 'does not render icon when showIcon is false', () => {
		const { container } = render(
			<TrendIndicator direction="up" value="+10%" showIcon={ false } />
		);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'svg' ) ).not.toBeInTheDocument();
	} );

	it( 'applies custom className', () => {
		const { container } = render(
			<TrendIndicator direction="up" value="+10%" className="custom-class" />
		);

		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild ).toHaveClass( 'custom-class' );
	} );

	it( 'renders numeric value', () => {
		render( <TrendIndicator direction="up" value={ 42 } /> );

		expect( screen.getByText( '42' ) ).toBeInTheDocument();
	} );

	it( 'applies custom style', () => {
		const { container } = render(
			<TrendIndicator direction="up" value="+10%" style={ { fontSize: '2rem' } } />
		);

		// Note getComputedStyle converts lengths to px.
		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild ).toHaveStyle( { fontSize: '32px' } );
	} );

	describe( 'chart scope class', () => {
		it( 'carries the scope class when rendered with no provider above it', () => {
			const { container } = render( <TrendIndicator direction="up" value="+10%" /> );

			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveClass( CHART_SCOPE_CLASS );
		} );

		it( 'does not carry the scope class when rendered inside a GlobalChartsProvider', () => {
			render(
				<GlobalChartsProvider>
					<TrendIndicator direction="up" value="+10%" />
				</GlobalChartsProvider>
			);

			expect( screen.getByLabelText( 'Increase: +10%' ) ).not.toHaveClass( CHART_SCOPE_CLASS );
		} );
	} );

	describe( 'accessibility', () => {
		it( 'provides aria-label for up trend', () => {
			const { container } = render( <TrendIndicator direction="up" value="+14%" /> );

			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveAttribute( 'aria-label', 'Increase: +14%' );
		} );

		it( 'provides aria-label for down trend', () => {
			const { container } = render( <TrendIndicator direction="down" value="-5%" /> );

			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveAttribute( 'aria-label', 'Decrease: -5%' );
		} );

		it( 'provides aria-label for neutral trend', () => {
			const { container } = render( <TrendIndicator direction="neutral" value="0%" /> );

			// eslint-disable-next-line testing-library/no-node-access
			expect( container.firstChild ).toHaveAttribute( 'aria-label', 'No change: 0%' );
		} );
	} );
} );
