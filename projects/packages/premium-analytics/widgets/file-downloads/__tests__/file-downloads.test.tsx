/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { captureCsvDownloads } from '../../test-utils';
import FileDownloadsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'FileDownloadsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( { date: '2026-06-22', days: {} } );
	} );

	it( 'links to the Downloads report', () => {
		render( <FileDownloadsWidget attributes={ {} } /> );

		expect( screen.getByRole( 'link', { name: 'View all' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( '/reports/downloads' )
		);
	} );

	describe( 'CSV export', () => {
		let downloads: ReturnType< typeof captureCsvDownloads >;

		beforeEach( () => {
			jest.useFakeTimers();
			downloads = captureCsvDownloads();
		} );

		afterEach( () => {
			jest.useRealTimers();
			downloads.restore();
		} );

		it( 'downloads the full File downloads report instead of the rows on screen', async () => {
			const files = Array.from( { length: 12 }, ( _, index ) => ( {
				filename: `file-${ index + 1 }.pdf`,
				relative_url: `/file-${ index + 1 }.pdf`,
				downloads: 100 - index,
			} ) );
			mockApiFetch.mockImplementation( ( { path }: { path: string } ) =>
				Promise.resolve( {
					date: '2026-03-10',
					days: {},
					summary: { files: path.includes( 'max=0' ) ? files : files.slice( 0, 10 ) },
				} )
			);

			render(
				<FileDownloadsWidget
					attributes={ { reportParams: { from: '2026-03-01', to: '2026-03-10' } } }
				/>
			);

			// This package does not depend on @testing-library/user-event.
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.click( await screen.findByRole( 'button', { name: /Download CSV/ } ) );
			await waitFor( () => expect( downloads.files ).toHaveLength( 1 ) );

			const lines = await downloads.lines();
			expect( lines[ 0 ] ).toBe( '"File","Downloads","URL"' );
			expect( lines ).toHaveLength( 13 );
			expect( downloads.files[ 0 ].filename ).toBe( 'file-downloads-2026-03-01_2026-03-10.csv' );
		} );
	} );
} );
