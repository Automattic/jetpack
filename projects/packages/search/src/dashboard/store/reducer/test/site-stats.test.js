import { setSearchStats } from '../../actions/site-stats';
import reducer from '../site-stats';

describe( 'Site stats reducer', () => {
	const initState = {
		post_count: 9,
		post_type_breakdown: [ { post: 1 } ],
	};
	test( 'should default to empty', () => {
		const state = reducer( undefined, {} );
		expect( state ).toEqual( {} );
	} );
	test( 'can init site stats', () => {
		const state = reducer( undefined, setSearchStats( { post_count: 123 } ) );
		expect( state ).toEqual( { post_count: 123 } );
	} );
	test( 'can update site stats', () => {
		const state = reducer(
			initState,
			setSearchStats( { post_count: 123, post_type_breakdown: [ { banana: 2 } ] } )
		);
		expect( state ).toEqual( { post_count: 123, post_type_breakdown: [ { banana: 2 } ] } );
	} );
} );
