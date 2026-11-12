/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { WidgetBackLink } from '../widget-back-link';

describe( 'WidgetBackLink', () => {
	it( 'names the current view after the link, outside the button', async () => {
		const onClick = jest.fn();
		render(
			<WidgetBackLink
				label="United States"
				ariaLabel="View regions in United States"
				current="California"
				onClick={ onClick }
				className="widget-trail"
			/>
		);

		const link = screen.getByRole( 'button', { name: 'View regions in United States' } );
		expect( link ).not.toHaveTextContent( 'California' );
		expect( link ).not.toHaveClass( 'widget-trail' );
		expect( screen.getByText( 'California' ) ).toBeInTheDocument();
		expect( screen.getByText( '/' ) ).toHaveAttribute( 'aria-hidden', 'true' );

		await userEvent.click( link );
		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders the link alone, with the class on it, without a current view', () => {
		render(
			<WidgetBackLink label="All locations" onClick={ jest.fn() } className="widget-link" />
		);

		const link = screen.getByRole( 'button', { name: 'All locations' } );
		expect( link ).toHaveClass( 'widget-link' );
		expect( screen.queryByText( '/' ) ).not.toBeInTheDocument();
	} );
} );
