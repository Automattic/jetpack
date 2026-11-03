import { VIDEO_DETAIL_LAYOUT } from './layout';

describe( 'video detail layout', () => {
	it( 'uses registered widget type names', () => {
		for ( const widget of VIDEO_DETAIL_LAYOUT ) {
			expect( widget.type ).toMatch( /^(?:jpa|videopress)\// );
		}
	} );

	it( 'uses unique widget UUIDs', () => {
		const uuids = VIDEO_DETAIL_LAYOUT.map( widget => widget.uuid );

		expect( new Set( uuids ).size ).toBe( uuids.length );
	} );

	// The composition is fixed (WOOA7S-1625): assert the exact arrangement so an
	// accidental reshuffle surfaces here, not in the rendered dashboard.
	it( 'composes the performance chart, then the player beside the embeds list', () => {
		expect( VIDEO_DETAIL_LAYOUT ).toEqual( [
			{
				uuid: 'video-detail-views-performance',
				type: 'jpa/video-detail-views-performance',
				attributes: { chartType: 'bar' },
				placement: { width: 'full', height: 2, order: 10 },
			},
			{
				uuid: 'videopress-video-player',
				type: 'videopress/video-player',
				placement: { width: 1, height: 2, order: 20 },
			},
			{
				uuid: 'video-detail-embeds',
				type: 'jpa/video-detail-embeds',
				placement: { width: 'fill', height: 2, order: 30 },
			},
		] );
	} );
} );
