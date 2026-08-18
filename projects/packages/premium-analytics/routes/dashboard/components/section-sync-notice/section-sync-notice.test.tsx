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

describe( 'SectionSyncNotice', () => {
	it( 'says the numbers are incomplete rather than only that a sync is running', () => {
		render(
			<SectionSyncNotice
				percentage={ 40 }
				hasError={ false }
				onRetry={ noop }
				isRetrying={ false }
			/>
		);

		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			'Your store data is still syncing (40%). The numbers below are incomplete until it finishes.'
		);
	} );

	it( 'leaves the percentage out until the sync reports progress', () => {
		render(
			<SectionSyncNotice
				percentage={ 0 }
				hasError={ false }
				onRetry={ noop }
				isRetrying={ false }
			/>
		);

		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			'Your store data is still syncing. The numbers below are incomplete until it finishes.'
		);
		expect( screen.getByRole( 'status' ) ).not.toHaveTextContent( '%' );
	} );

	it( 'offers a retry instead of progress once the sync fails', async () => {
		const onRetry = jest.fn();
		render(
			<SectionSyncNotice percentage={ 40 } hasError onRetry={ onRetry } isRetrying={ false } />
		);

		expect( screen.getByRole( 'status' ) ).toHaveTextContent(
			'Something went wrong while syncing your store data, so the numbers below are incomplete.'
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Try again' } ) );
		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );
} );
