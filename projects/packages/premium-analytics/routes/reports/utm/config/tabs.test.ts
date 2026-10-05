import { getReportUtmTabs, resolveSection } from './tabs';

describe( 'UTM report tabs', () => {
	it( 'matches the widget dimension order and defaults to Source / Medium', () => {
		expect( getReportUtmTabs() ).toEqual( [
			{ id: 'source-medium', label: 'Source / Medium' },
			{ id: 'campaign-source-medium', label: 'Campaign / Source / Medium' },
			{ id: 'source', label: 'Source' },
			{ id: 'medium', label: 'Medium' },
			{ id: 'campaign', label: 'Campaign' },
		] );
		expect( resolveSection( undefined ) ).toBe( 'source-medium' );
		expect( resolveSection( 'missing' ) ).toBe( 'source-medium' );
	} );

	it.each( [ 'source-medium', 'campaign-source-medium', 'source', 'medium', 'campaign' ] as const )(
		'resolves %s',
		tab => {
			expect( resolveSection( tab ) ).toBe( tab );
		}
	);
} );
