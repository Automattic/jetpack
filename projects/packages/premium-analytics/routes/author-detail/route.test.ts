import { route } from './route';

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( ( options: object ) => ( { isRedirect: true, ...options } ) ),
} ) );

describe( 'author detail route', () => {
	it( 'redirects to the generic report route with the id and the whole search', () => {
		const search = { from: '2026-06-01', to: '2026-06-16', ds: 'traffic' };

		expect( () => route.beforeLoad( { params: { authorId: '3' }, search } ) ).toThrow(
			expect.objectContaining( {
				to: '/report/$kind/$id',
				params: { kind: 'author', id: '3' },
				search,
				replace: true,
			} )
		);
	} );
} );
