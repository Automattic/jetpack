import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaleDataNotice } from '../stale-data-notice';

const FIVE_MINUTES_AGO = () => Date.now() - 5 * 60 * 1000;

// The notice's copy is also mirrored into the `speak()` live region, so the
// queries below name the description element rather than matching both.
function description( text: RegExp ) {
	return screen.getByText( text, { selector: 'span' } );
}

describe( 'StaleDataNotice', () => {
	it( 'names how old the data on screen is', () => {
		render( <StaleDataNotice updatedAt={ FIVE_MINUTES_AGO() } /> );

		expect( description( /Showing data from 5 minutes ago\./ ) ).toBeInTheDocument();
	} );

	it( 'offers a retry that runs the handler', async () => {
		const onRetry = jest.fn();
		render( <StaleDataNotice updatedAt={ FIVE_MINUTES_AGO() } onRetry={ onRetry } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'omits the retry where retrying cannot help', () => {
		render( <StaleDataNotice updatedAt={ FIVE_MINUTES_AGO() } /> );

		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'ages the label while it stays on screen', () => {
		jest.useFakeTimers();
		try {
			render( <StaleDataNotice updatedAt={ FIVE_MINUTES_AGO() } /> );

			act( () => {
				jest.advanceTimersByTime( 2 * 60 * 1000 );
			} );

			expect( description( /Showing data from 7 minutes ago\./ ) ).toBeInTheDocument();
		} finally {
			jest.useRealTimers();
		}
	} );
} );
