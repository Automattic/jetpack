import {
	createDetailLinkSearch,
	createReportOriginSearch,
	pickReportOriginParams,
	readReportOriginSearch,
} from './report-origin';

describe( 'report origin search params', () => {
	it( 'round-trips a report and section', () => {
		expect( readReportOriginSearch( createReportOriginSearch( 'comments', 'posts' ) ) ).toEqual( {
			report: 'comments',
			section: 'posts',
		} );
	} );

	it( 'omits an empty section', () => {
		expect( createReportOriginSearch( 'videos' ) ).toEqual( { ref: 'videos' } );
		expect( readReportOriginSearch( createReportOriginSearch( 'videos' ) ) ).toEqual( {
			report: 'videos',
		} );
	} );

	it.each( [
		[ 'no search', undefined ],
		[ 'no ref', { from: '2026-06-01' } ],
		[ 'an empty ref', { ref: '' } ],
		[ 'a non-string ref', { ref: 42 } ],
	] )( 'reads no origin from %s', ( _label, search ) => {
		expect( readReportOriginSearch( search as Record< string, unknown > ) ).toBeUndefined();
	} );

	it( 'picks only the origin params that are set', () => {
		expect(
			pickReportOriginParams( {
				from: '2026-06-01',
				ref: 'posts',
				ref_section: 'archives',
				post_id: '42',
			} )
		).toEqual( { ref: 'posts', ref_section: 'archives' } );

		expect( pickReportOriginParams( { from: '2026-06-01' } ) ).toEqual( {} );
		expect( pickReportOriginParams( undefined ) ).toEqual( {} );
	} );

	it( 'builds a detail link updater from the report window, the origin, and the destination params', () => {
		const updateSearch = createDetailLinkSearch( {
			report: 'emails',
			extraParams: { section: 'email-opens' },
		} );

		expect( updateSearch( { from: '2026-06-01', post_id: '42', section: 'archives' } ) ).toEqual( {
			from: '2026-06-01',
			ref: 'emails',
			section: 'email-opens',
		} );
	} );
} );
