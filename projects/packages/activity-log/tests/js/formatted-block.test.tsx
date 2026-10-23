import { render, screen } from '@testing-library/react';

const FORMATTED_BLOCK = '../../src/js/components/ActivityLog/formatted-block';
const TEMPLATE = '/wp-admin/admin.php?page=jetpack-backup&p=%2F%3Fselected%3D%2522{rewindId}%2522';

/**
 * Render a backup range with the Backup dashboard's link template in place.
 *
 * @param rewindId - The range's rewind id.
 */
function renderBackupRange( rewindId: string ) {
	( globalThis as Record< string, unknown > ).JPACTIVITYLOG_INITIAL_STATE = {
		jetpackStatus: { backupUrlTemplate: TEMPLATE },
	};
	jest.isolateModules( () => {
		// The template is read when the module loads.
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { renderFormattedContent } = require( FORMATTED_BLOCK );
		render(
			<>
				{ renderFormattedContent( {
					items: [ { type: 'backup', rewindId, children: [ 'Oct 17, 2026' ] } ],
				} ) }
			</>
		);
	} );
}

describe( 'a backup range', () => {
	it.each( [ '1792247404', '1792247404.817' ] )(
		'links rewind id %s inside the encoded path',
		rewindId => {
			renderBackupRange( rewindId );

			const href =
				screen.getByRole( 'link', { name: 'Oct 17, 2026' } ).getAttribute( 'href' ) ?? '';
			const path = new URL( href, 'https://example.com' ).searchParams.get( 'p' );
			expect( path ).toBe( `/?selected=%22${ rewindId }%22` );
		}
	);

	it.each( [ '123%22&foo=bar', '1792247404.', 'abc', '' ] )(
		'stays plain text for rewind id %p',
		rewindId => {
			renderBackupRange( rewindId );

			expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Oct 17, 2026' ) ).toBeInTheDocument();
		}
	);
} );
