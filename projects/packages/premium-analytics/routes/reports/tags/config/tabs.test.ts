import { getReportTagsTabs, resolveSection } from './tabs';

describe( 'Tags report tabs', () => {
	it( 'matches the widget View toggle and defaults to All', () => {
		expect( getReportTagsTabs() ).toEqual( [
			{ id: 'all', label: 'All' },
			{ id: 'tags', label: 'Tags' },
			{ id: 'categories', label: 'Categories' },
		] );
		expect( resolveSection( undefined ) ).toBe( 'all' );
		expect( resolveSection( 'tag' ) ).toBe( 'all' );
	} );
} );
