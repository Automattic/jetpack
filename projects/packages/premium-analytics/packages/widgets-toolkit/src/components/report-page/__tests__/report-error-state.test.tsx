/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportErrorState } from '../report-error-state';

describe( 'ReportErrorState', () => {
	it( 'renders the given title', () => {
		render( <ReportErrorState title="Unable to load posts" onRetry={ jest.fn() } /> );

		expect( screen.getByText( 'Unable to load posts' ) ).toBeInTheDocument();
	} );

	it( 'renders a custom description', () => {
		render(
			<ReportErrorState
				title="Unable to load posts"
				description="The posts report is unavailable."
				onRetry={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'The posts report is unavailable.' ) ).toBeInTheDocument();
	} );

	it( 'renders the default description', () => {
		render( <ReportErrorState title="Unable to load posts" onRetry={ jest.fn() } /> );

		expect(
			screen.getByText( "We couldn't load this data. Please try again in a moment." )
		).toBeInTheDocument();
	} );

	it( 'calls onRetry when Retry is clicked', () => {
		const onRetry = jest.fn();
		render( <ReportErrorState title="Unable to load posts" onRetry={ onRetry } /> );

		// eslint-disable-next-line testing-library/prefer-user-event -- @testing-library/user-event is not a direct dependency of this package.
		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );
} );
