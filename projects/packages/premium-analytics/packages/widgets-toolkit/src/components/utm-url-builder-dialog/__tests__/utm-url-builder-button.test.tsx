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
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'names the post and calls onClick', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const onClick = jest.fn();
		render( <UtmUrlBuilderButton label="Hello" onClick={ onClick } /> );

		const button = screen.getByRole( 'button', { name: 'Build URL for "Hello"' } );
		await user.hover( button );

		await expect( screen.findByText( 'Build URL' ) ).resolves.toBeInTheDocument();

		await user.click( button );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );
} );
