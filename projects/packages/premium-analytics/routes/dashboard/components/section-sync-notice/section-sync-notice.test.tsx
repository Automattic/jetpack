/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { SectionSyncNotice } from './section-sync-notice';

const noop = () => {};

/*
 * The notice speaks its message through `@wordpress/a11y`, which mirrors the
 * text into a live region on `document.body`. Assertions read the rendered
 * container so they don't match that copy too.
 */
describe( 'SectionSyncNotice', () => {
	it( 'says the numbers are incomplete rather than only that a sync is running', () => {
		const { container } = render(
			<SectionSyncNotice
				percentage={ 40 }
				hasError={ false }
				onRetry={ noop }
				isRetrying={ false }
			/>
		);

		expect( container ).toHaveTextContent(
			'Your store data is still syncing (40%). The numbers below are incomplete until it finishes.'
		);
	} );

	it( 'leaves the percentage out until the sync reports progress', () => {
		const { container } = render(
			<SectionSyncNotice
				percentage={ 0 }
				hasError={ false }
				onRetry={ noop }
				isRetrying={ false }
			/>
		);

		expect( container ).toHaveTextContent(
			'Your store data is still syncing. The numbers below are incomplete until it finishes.'
		);
	} );

	it( 'drops the percentage at 100, where the sync is sent but not yet confirmed', () => {
		const { container } = render(
			<SectionSyncNotice
				percentage={ 100 }
				hasError={ false }
				onRetry={ noop }
				isRetrying={ false }
			/>
		);

		expect( container ).toHaveTextContent(
			'Your store data is still syncing. The numbers below are incomplete until it finishes.'
		);
	} );

	it( 'tells a reader who cannot run the sync who can, with no progress or retry', () => {
		const { container } = render(
			<SectionSyncNotice
				canRunSync={ false }
				percentage={ 0 }
				hasError
				onRetry={ noop }
				isRetrying={ false }
			/>
		);

		expect( container ).toHaveTextContent(
			"Your store data hasn't finished syncing, so the numbers below are incomplete. It finishes once a site administrator opens this page."
		);
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'offers a retry once the sync fails', async () => {
		const onRetry = jest.fn();
		const { container } = render(
			<SectionSyncNotice percentage={ 40 } hasError onRetry={ onRetry } isRetrying={ false } />
		);

		expect( container ).toHaveTextContent(
			'Something went wrong while syncing your store data, so the numbers below are incomplete.'
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'holds the failure layout while a retry is in flight', () => {
		// Starting the sync clears the error before the request settles, so for
		// that stretch the notice sees no error and a retry in flight.
		const { container, rerender } = render(
			<SectionSyncNotice percentage={ 40 } hasError onRetry={ noop } isRetrying={ false } />
		);
		const liveRegion = screen.getByText( 'Something went wrong', {
			exact: false,
			selector: '#a11y-speak-assertive',
		} );

		rerender(
			<SectionSyncNotice percentage={ 40 } hasError={ false } onRetry={ noop } isRetrying />
		);

		// Reports busy via `aria-disabled`, not `disabled`, so it keeps the focus the
		// press gave it; nothing announced a switch back to "still syncing" either.
		const retry = screen.getByRole( 'button', { name: 'Try again' } );
		expect( retry ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( container ).toHaveTextContent( 'Something went wrong' );
		expect( liveRegion ).not.toHaveTextContent( 'still syncing' );
	} );

	it( 'does not announce the syncing state or its progress', () => {
		const { rerender } = render(
			<SectionSyncNotice
				percentage={ 40 }
				hasError={ false }
				onRetry={ noop }
				isRetrying={ false }
			/>
		);
		rerender(
			<SectionSyncNotice
				percentage={ 41 }
				hasError={ false }
				onRetry={ noop }
				isRetrying={ false }
			/>
		);

		expect(
			screen.queryByText( /still syncing/, { selector: '.a11y-speak-region' } )
		).not.toBeInTheDocument();
	} );

	it( 'survives the switch to the retry state and back', () => {
		const { container, rerender } = render(
			<SectionSyncNotice
				percentage={ 40 }
				hasError={ false }
				onRetry={ noop }
				isRetrying={ false }
			/>
		);

		rerender(
			<SectionSyncNotice percentage={ 40 } hasError onRetry={ noop } isRetrying={ false } />
		);
		expect( container ).toHaveTextContent( 'Something went wrong' );

		rerender(
			<SectionSyncNotice
				percentage={ 40 }
				hasError={ false }
				onRetry={ noop }
				isRetrying={ false }
			/>
		);
		expect( container ).toHaveTextContent( 'still syncing' );
	} );
} );
