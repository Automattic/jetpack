import selectors from '../site-data';

describe( 'siteDataSelectors', () => {
	describe( 'getSiteData()', () => {
		it( 'should return empty array when siteData is undefined', () => {
			const state = {
				siteData: undefined,
			};
			const output = selectors.getSiteData( state );
			expect( output ).toEqual( [] );
		} );

		it( 'should return siteData content when object has content', () => {
			const state = {
				siteData: {
					id: '123456',
					title: 'Dummy title',
				},
			};
			const output = selectors.getSiteData( state );
			expect( output ).toEqual( {
				id: '123456',
				title: 'Dummy title',
			} );
		} );
	} );

	describe( 'getSiteTitle()', () => {
		it( 'should return empty string when siteData state is an empty object', () => {
			const state = {
				siteData: {},
			};
			const output = selectors.getSiteTitle( state );
			expect( output ).toBe( '' );
		} );

		it( 'should return empty string when does not include a title', () => {
			const state = {
				siteData: {
					id: 123,
				},
			};
			const output = selectors.getSiteTitle( state );
			expect( output ).toBe( '' );
		} );

		it( 'should return title when includes siteData with a title', () => {
			const state = {
				siteData: {
					id: '123456',
					title: 'Dummy title',
				},
			};
			const output = selectors.getSiteTitle( state );
			expect( output ).toBe( 'Dummy title' );
		} );
	} );

	describe( 'getBlogId()', () => {
		it( 'should return null when siteData state is an empty object', () => {
			const state = {
				siteData: {},
			};
			const output = selectors.getBlogId( state );
			expect( output ).toBeNull();
		} );

		it( 'should return title when includes siteData with a blog ID', () => {
			const state = {
				siteData: {
					id: '123456',
				},
			};
			const output = selectors.getBlogId( state );
			expect( output ).toBe( '123456' );
		} );
	} );
} );
