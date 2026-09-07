import { getReportUtmTabs, getUtmParam, resolveSection } from './tabs';

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

	it.each( [
		[ 'source-medium', 'utm_source,utm_medium' ],
		[ 'campaign-source-medium', 'utm_campaign,utm_source,utm_medium' ],
		[ 'source', 'utm_source' ],
		[ 'medium', 'utm_medium' ],
		[ 'campaign', 'utm_campaign' ],
	] as const )( 'resolves %s to %s', ( tab, utmParam ) => {
		expect( resolveSection( tab ) ).toBe( tab );
		expect( getUtmParam( tab ) ).toBe( utmParam );
	} );
} );
