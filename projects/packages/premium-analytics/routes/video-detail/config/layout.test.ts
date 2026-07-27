import { WIDGET_DASHBOARD_COLUMN_COUNT } from '@wordpress/widget-dashboard';
import { VIDEO_DETAIL_LAYOUT } from './layout';

describe( 'video detail layout', () => {
	it( 'uses registered Premium Analytics widget types', () => {
		for ( const widget of VIDEO_DETAIL_LAYOUT ) {
			expect( widget.type ).toMatch( /^jpa\// );
		}
	} );

	it( 'uses unique widget UUIDs', () => {
		const uuids = VIDEO_DETAIL_LAYOUT.map( widget => widget.uuid );

		expect( new Set( uuids ).size ).toBe( uuids.length );
	} );

	// The page's composition is fixed (WOOA7S-1625): assert the exact
	// arrangement, like the post-detail tab layouts test, so accidental
	// reshuffles surface here rather than in the rendered dashboard.
	it( 'composes the video highlights above the embeds widget', () => {
		expect( VIDEO_DETAIL_LAYOUT ).toEqual( [
			{
				uuid: 'video-detail-highlights',
				type: 'jpa/video-detail-highlights',
				placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 1, order: 1 },
			},
			{
				uuid: 'video-detail-embeds',
				type: 'jpa/video-detail-embeds',
				placement: { width: WIDGET_DASHBOARD_COLUMN_COUNT, height: 2, order: 2 },
			},
		] );
	} );
} );
