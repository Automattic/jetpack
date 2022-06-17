import { setSearchPlanInfo } from '../../actions/site-plan';
import reducer from '../site-plan';

describe( 'Site plan reducer', () => {
	const initState = {
		supports_search: false,
	};
	test( 'should default to empty', () => {
		const state = reducer( undefined, {} );
		expect( state ).toEqual( {} );
	} );
	test( 'can init site plan', () => {
		const state = reducer( undefined, setSearchPlanInfo( { supports_search: true } ) );
		expect( state ).toEqual( { supports_search: true } );
	} );
	test( 'can update site plan', () => {
		const state = reducer( initState, setSearchPlanInfo( { supports_search: true } ) );
		expect( state ).toEqual( { supports_search: true } );
	} );
} );
