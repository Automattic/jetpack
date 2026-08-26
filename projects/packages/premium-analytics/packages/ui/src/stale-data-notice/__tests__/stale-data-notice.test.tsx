import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaleDataNotice } from '../stale-data-notice';

/**
 * What a screen reader is handed: `speak()` writes into `@wordpress/a11y`'s
 * polite live region, which is a plain node in the document.
 */
function announcement() {
	return ( document.querySelector( '#a11y-speak-polite' )?.textContent ?? '' ).trim();
}

const minutesAgo = ( minutes: number ) => Date.now() - minutes * 60 * 1000;

// The notice's copy is also mirrored into the `speak()` live region, so the
// queries below name the description element rather than matching both.
function description( text: RegExp ) {
	return screen.getByText( text, { selector: 'span' } );
}

describe( 'StaleDataNotice', () => {
	it( 'names how old the data on screen is', () => {
		render( <StaleDataNotice updatedAt={ minutesAgo( 5 ) } /> );

		expect( description( /Showing data from 5 minutes ago\./ ) ).toBeInTheDocument();
	} );

	it( 'does not count seconds for data fetched moments ago', () => {
		render( <StaleDataNotice updatedAt={ Date.now() } /> );

		expect( description( /Showing data from less than a minute ago\./ ) ).toBeInTheDocument();
	} );

	it( 'offers a retry that runs the handler', async () => {
		const onRetry = jest.fn();
		render( <StaleDataNotice updatedAt={ minutesAgo( 5 ) } onRetry={ onRetry } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'omits the retry when no handler is given', () => {
		render( <StaleDataNotice updatedAt={ minutesAgo( 5 ) } /> );

		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	} );

	it( 'stops accepting clicks while a retry is in flight', async () => {
		const onRetry = jest.fn();
		render( <StaleDataNotice updatedAt={ minutesAgo( 5 ) } onRetry={ onRetry } isRetrying /> );

		// Soft-disabled: the button keeps its place in the tab order but rejects
		// the click, so a slow refetch cannot be queued up twice.
		const retry = screen.getByRole( 'button', { name: 'Retry' } );
		expect( retry ).toHaveAttribute( 'aria-disabled', 'true' );

		await userEvent.click( retry );
		expect( onRetry ).not.toHaveBeenCalled();
	} );

	it( 'announces a fixed sentence, without the ageing label or the button', () => {
		render( <StaleDataNotice updatedAt={ minutesAgo( 5 ) } onRetry={ jest.fn() } /> );

		expect( announcement() ).toBe( "Couldn't refresh. The numbers on screen may be out of date." );
	} );

	it( 'ages the label while it stays on screen, without announcing it again', () => {
		jest.useFakeTimers();
		try {
			render( <StaleDataNotice updatedAt={ minutesAgo( 5 ) } /> );
			const announced = announcement();

			act( () => {
				jest.advanceTimersByTime( 2 * 60 * 1000 );
			} );

			expect( description( /Showing data from 7 minutes ago\./ ) ).toBeInTheDocument();
			// Interrupting a screen reader once a minute, for as long as the notice
			// stays up, is what the fixed `spokenMessage` exists to prevent: the
			// announcement never mentions an age, so it never changes.
			expect( announcement() ).toBe( announced );
			expect( announced ).not.toMatch( /minutes ago/ );
		} finally {
			jest.useRealTimers();
		}
	} );
} );
