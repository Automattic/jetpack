import { entityAdapter } from '../entity';
import { pageAdapter } from '.';

const SUMMARY = {
	isLoading: false,
	isError: false,
	error: null,
	isNotFound: false,
	refetch: () => {},
};

const CONTEXT = { label: 'Page', title: 'Page' };

describe( 'pageAdapter', () => {
	it( 'reads the page as the entity adapter does', () => {
		expect( pageAdapter.useSummary ).toBe( entityAdapter.useSummary );
		expect( pageAdapter.headerActions ).toBe( entityAdapter.headerActions );
	} );

	it( 'titles an untitled page', () => {
		expect( pageAdapter.untitledTitle?.( SUMMARY ) ).toBe( 'Untitled page' );
	} );

	it.each( [
		[ 'missing', { isNotFound: true }, 'Page not found' ],
		[ 'failed', { isError: true }, 'Page unavailable' ],
	] )( 'names the page in the header of a %s one', ( _name, state, title ) => {
		expect( pageAdapter.headerSlots( { ...SUMMARY, ...state }, CONTEXT ).title ).toBe( title );
	} );

	it( 'names the page in the not-found notice', () => {
		expect( pageAdapter.notFoundDescription?.() ).toBe( "We couldn't find this page." );
	} );
} );
