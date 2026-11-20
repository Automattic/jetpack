import { route } from './route';

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( ( options: object ) => ( { isRedirect: true, ...options } ) ),
} ) );

describe( 'post detail route', () => {
	it( 'redirects to the generic report route with the id and the whole search', () => {
		const search = { from: '2026-06-01', to: '2026-06-16', section: 'email-opens', ref: 'posts' };

		expect( () => route.beforeLoad( { params: { postId: '42' }, search } ) ).toThrow(
			expect.objectContaining( {
				to: '/report/$kind/$id',
				params: { kind: 'post', id: '42' },
				search,
				replace: true,
			} )
		);
	} );
} );
