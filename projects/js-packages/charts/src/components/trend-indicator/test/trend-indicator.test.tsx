import { render, screen } from '@testing-library/react';
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
		render( <TrendIndicator direction="up" value="+10%" /> );

		expect( screen.getByRole( 'img', { hidden: true } ) ).toBeInTheDocument();
	} );

	it( 'renders icon for down direction', () => {
		render( <TrendIndicator direction="down" value="-10%" /> );

		expect( screen.getByRole( 'img', { hidden: true } ) ).toBeInTheDocument();
	} );

	it( 'does not render icon for neutral direction', () => {
		render( <TrendIndicator direction="neutral" value="0%" /> );

		expect( screen.queryByRole( 'img', { hidden: true } ) ).not.toBeInTheDocument();
	} );

	it( 'applies custom className', () => {
		const { container } = render(
			<TrendIndicator direction="up" value="+10%" className="custom-class" />
		);

		// eslint-disable-next-line testing-library/no-node-access
		expect( container.firstChild ).toHaveClass( 'custom-class' );
	} );
} );
