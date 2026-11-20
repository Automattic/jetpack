/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

await jest.unstable_mockModule( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: { recordEvent: jest.fn() } } ),
} ) );

const { default: CSVExport } =
	await import( '../../../../../src/dashboard/components/export-responses/csv' );

describe( 'CSVExport', () => {
	it( 'shows an error snackbar instead of downloading a failed export', async () => {
		const errorPage = {
			ok: false,
			statusText: 'Internal Server Error',
			headers: { get: () => null },
			blob: () => Promise.resolve( new Blob( [ '<p>There has been a critical error</p>' ] ) ),
		};
		const onExport = jest.fn( () => Promise.resolve( errorPage ) );
		const createObjectURL = jest.fn();
		window.URL.createObjectURL = createObjectURL;
		render( <CSVExport onExport={ onExport } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Download' } ) );

		await waitFor( () =>
			expect( select( noticesStore ).getNotices() ).toEqual( [
				expect.objectContaining( {
					status: 'error',
					type: 'snackbar',
					content: 'Could not export your responses. Please try again.',
				} ),
			] )
		);
		expect( createObjectURL ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'button', { name: 'Download' } ) ).toBeEnabled();
	} );
} );
