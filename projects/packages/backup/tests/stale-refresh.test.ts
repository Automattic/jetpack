import { queryClient } from '../src/dashboard/data/query-client';

const shown = ( detail: object ) =>
	window.dispatchEvent( new CustomEvent( 'jetpack-admin-shell:page-shown', { detail } ) );

describe( 'Backup in the admin shell', () => {
	it.each( [
		[
			'refetches when shown stale',
			{ page: 'jetpack-backup', stale: true },
			[ [ { queryKey: [ 'backup' ] } ] ],
		],
		[ 'keeps its data when shown fresh', { page: 'jetpack-backup', stale: false }, [] ],
		[ 'ignores another stale page', { page: 'my-jetpack', stale: true }, [] ],
	] )( '%s', ( _, detail, calls ) => {
		const invalidate = jest.spyOn( queryClient, 'invalidateQueries' ).mockResolvedValue();

		shown( detail );

		expect( invalidate.mock.calls ).toEqual( calls );
		invalidate.mockRestore();
	} );
} );
