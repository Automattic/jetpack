import { privacyStringToInt, toLibraryItem } from '../library-item';

describe( 'privacyStringToInt', () => {
	it( 'maps UI privacy strings to WPCOM integer codes', () => {
		expect( privacyStringToInt( 'public' ) ).toBe( 0 );
		expect( privacyStringToInt( 'private' ) ).toBe( 1 );
		expect( privacyStringToInt( 'site-default' ) ).toBe( 2 );
	} );
} );

describe( 'toLibraryItem', () => {
	it( 'maps a video/videopress attachment whose guid has not arrived yet to a processing VideoPress item', () => {
		const item = toLibraryItem(
			{
				id: 11,
				title: { rendered: 'Just uploaded' },
				mime_type: 'video/videopress',
				media_details: {},
				jetpack_videopress: { guid: '' },
			},
			false
		);

		expect( item.type ).toBe( 'videopress' );
		expect( item.isProcessing ).toBe( true );
	} );

	it( 'keeps a guid-less attachment with a regular video mime local', () => {
		const item = toLibraryItem(
			{ id: 12, title: { rendered: 'On disk' }, mime_type: 'video/mp4', media_details: {} },
			false
		);

		expect( item.type ).toBe( 'local' );
		expect( item.isProcessing ).toBe( false );
	} );
} );

describe( 'terminal conversion failure', () => {
	it( 'stops processing and keeps the uploaded item deletable after reload', () => {
		const item = toLibraryItem(
			{
				id: 91,
				mime_type: 'video/videopress',
				media_details: {
					file_statuses: { mp4: 'ERROR', ogg: 'DONE' },
					videopress: { finished: true },
				},
			},
			false
		);
		expect( item ).toMatchObject( {
			conversionFailed: true,
			isProcessing: false,
			upload: { status: 'idle' },
		} );
	} );
} );
