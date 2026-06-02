import {
	CAPTION_CUE_BLOCK_NAME,
	captionBlocksToCues,
	formatSecondsAsTimestamp,
	normalizeCueTimestamp,
	parseCaptionTextTrack,
	serializeCuesToWebVtt,
} from '../cues';

describe( 'caption cue utilities', () => {
	it( 'normalizes timestamps', () => {
		expect( formatSecondsAsTimestamp( 62.5 ) ).toBe( '00:01:02.500' );
		expect( normalizeCueTimestamp( '01:02.500' ) ).toBe( '00:01:02.500' );
		expect( normalizeCueTimestamp( '00:01:02,500' ) ).toBe( '00:01:02.500' );
	} );

	it( 'extracts cues from caption cue blocks', () => {
		expect(
			captionBlocksToCues( [
				{
					name: CAPTION_CUE_BLOCK_NAME,
					attributes: {
						startTime: '0',
						endTime: '2.5',
						text: 'Hello',
					},
				},
				{ name: 'core/paragraph', attributes: { text: 'Ignored' } },
			] )
		).toEqual( [
			{
				startTime: '00:00:00.000',
				endTime: '00:00:02.500',
				text: 'Hello',
			},
		] );
	} );

	it( 'serializes cues to WebVTT', () => {
		expect(
			serializeCuesToWebVtt( [
				{
					startTime: '0',
					endTime: '2.5',
					text: 'Trail closed. Trail open.',
				},
			] )
		).toBe( 'WEBVTT\n\n00:00:00.000 --> 00:00:02.500\nTrail closed. Trail open.\n' );
	} );

	it( 'parses WebVTT and SRT cues', () => {
		expect(
			parseCaptionTextTrack(
				'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello\n\n1\n00:00:03,000 --> 00:00:04,500\nWorld'
			)
		).toEqual( [
			{ startTime: '00:00:00.000', endTime: '00:00:02.000', text: 'Hello' },
			{ startTime: '00:00:03.000', endTime: '00:00:04.500', text: 'World' },
		] );
	} );
} );
