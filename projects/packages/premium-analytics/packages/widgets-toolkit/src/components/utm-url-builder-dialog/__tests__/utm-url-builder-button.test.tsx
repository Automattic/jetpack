/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { UtmUrlBuilderButton } from '../utm-url-builder-button';

describe( 'UtmUrlBuilderButton', () => {
	it( 'names the post and calls onClick', async () => {
		const onClick = jest.fn();
		render( <UtmUrlBuilderButton label="Hello" onClick={ onClick } /> );

		const button = screen.getByRole( 'button', { name: 'Build URL for "Hello"' } );
		await userEvent.hover( button );

		await expect( screen.findByText( 'Build URL' ) ).resolves.toBeInTheDocument();

		await userEvent.click( button );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );
} );
