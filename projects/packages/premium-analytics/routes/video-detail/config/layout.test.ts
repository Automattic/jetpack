import { PA_COLUMN_COUNT } from '../../grid';
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
	it( 'composes the player, then the performance chart, then the embeds list', () => {
		expect( VIDEO_DETAIL_LAYOUT ).toEqual( [
			{
				uuid: 'videopress-video-player',
				type: 'videopress/video-player',
				placement: { width: PA_COLUMN_COUNT, height: 3, order: 1 },
			},
			{
				uuid: 'video-detail-views-performance',
				type: 'jpa/video-detail-views-performance',
				attributes: { chartType: 'bar' },
				placement: { width: PA_COLUMN_COUNT, height: 2, order: 2 },
			},
			{
				uuid: 'video-detail-embeds',
				type: 'jpa/video-detail-embeds',
				placement: { width: PA_COLUMN_COUNT, height: 2, order: 3 },
			},
		] );
	} );
} );
