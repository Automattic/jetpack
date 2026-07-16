/**
 * External dependencies
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { CsvDownloadButton } from '../csv-download-button';

describe( 'CsvDownloadButton', () => {
	it( 'shows a loading state and prevents duplicate downloads while busy', async () => {
		let resolveDownload: () => void = () => {};
		const onDownload = jest.fn(
			() =>
				new Promise< void >( resolve => {
					resolveDownload = resolve;
				} )
		);

		render( <CsvDownloadButton onDownload={ onDownload } /> );

		const button = screen.getByRole( 'button', { name: /Download CSV/ } );
		// This package does not depend on @testing-library/user-event.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );

		await waitFor( () => expect( button ).toHaveAttribute( 'aria-disabled', 'true' ) );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( button );
		expect( onDownload ).toHaveBeenCalledTimes( 1 );

		await act( async () => resolveDownload() );
		await waitFor( () => expect( button ).not.toHaveAttribute( 'aria-disabled', 'true' ) );
	} );

	it( 'shows download failures without replacing the action', async () => {
		render(
			<CsvDownloadButton
				onDownload={ () => Promise.reject( new Error( 'Upstream API unavailable.' ) ) }
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: /Download CSV/ } ) );

		await expect(
			screen.findByText( 'Upstream API unavailable.', { selector: 'span' } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /Download CSV/ } ) ).toBeInTheDocument();

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );
		await waitFor( () =>
			expect(
				screen.queryByText( 'Upstream API unavailable.', { selector: 'span' } )
			).not.toBeInTheDocument()
		);
	} );
} );
