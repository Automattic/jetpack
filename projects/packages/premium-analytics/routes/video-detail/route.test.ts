import { route } from './route';

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( ( options: object ) => ( { isRedirect: true, ...options } ) ),
} ) );

describe( 'video detail route.beforeLoad', () => {
	it( 'sends a bookmark to the generic report route with its id and search', () => {
		const search = { from: '2026-06-01', to: '2026-06-16', ref: 'videos', comp: '1' };

		expect( () => route.beforeLoad( { params: { videoId: '42' }, search } ) ).toThrow(
			expect.objectContaining( {
				to: '/report/$kind/$id',
				params: { kind: 'video', id: '42' },
				search,
				replace: true,
			} )
		);
	} );
} );
