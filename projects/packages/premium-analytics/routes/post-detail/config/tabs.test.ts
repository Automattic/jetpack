import { DEFAULT_TAB_ID, POST_DETAIL_TAB_IDS, getPostDetailTabs, resolveTabId } from './tabs';

describe( 'post-detail tabs', () => {
	it( 'builds the ordered tab definitions', () => {
		expect( getPostDetailTabs() ).toEqual( [
			{ id: 'post-traffic', label: 'Post traffic' },
			{ id: 'email-opens', label: 'Email opens' },
			{ id: 'email-clicks', label: 'Email clicks' },
		] );
	} );

	it( 'holds only the tab named for the post type while the type loads', () => {
		expect( getPostDetailTabs( undefined, true ).map( tab => tab.isPending ) ).toEqual( [
			true,
			undefined,
			undefined,
		] );
	} );

	it( 'keeps the default tab first', () => {
		expect( DEFAULT_TAB_ID ).toBe( 'post-traffic' );
		expect( POST_DETAIL_TAB_IDS[ 0 ] ).toBe( DEFAULT_TAB_ID );
	} );

	it( 'resolves unknown tab search values to the default tab', () => {
		expect( resolveTabId( 'email-opens' ) ).toBe( 'email-opens' );
		expect( resolveTabId( 'missing' ) ).toBe( DEFAULT_TAB_ID );
		expect( resolveTabId( undefined ) ).toBe( DEFAULT_TAB_ID );
	} );
} );
