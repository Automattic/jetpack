import { videosPath } from '../add-matching-dialog';

describe( 'videosPath', () => {
	it( 'sends selected terms as arrays and leaves out empty filters', () => {
		const path = videosPath(
			{
				search: '  weekly roundup ',
				length: 'mid',
				terms: { videopress_series: [ 'town-hall' ], videopress_topic: [] },
			},
			2,
			100
		);
		const params = new URLSearchParams( path.split( '?' )[ 1 ] );

		expect( params.get( 'search' ) ).toBe( 'weekly roundup' );
		expect( params.get( 'videopress_series[0]' ) ).toBe( 'town-hall' );
		expect( [ ...params.keys() ].some( key => key.startsWith( 'videopress_topic' ) ) ).toBe(
			false
		);
		expect( params.get( 'page' ) ).toBe( '2' );
	} );
} );
