import {
	CAPTION_CUE_BLOCK_NAME,
	captionBlocksToCues,
	formatSecondsAsTimestamp,
	getCaptionCueValidationErrors,
	normalizeCueTimestamp,
	parseCaptionTextInput,
	parseCaptionTextTrack,
	parseCaptionTranscript,
	serializeCuesToWebVtt,
} from '../cues';

describe( 'caption cue utilities', () => {
	it( 'normalizes timestamps', () => {
		expect( formatSecondsAsTimestamp( 62.5 ) ).toBe( '00:01:02.500' );
		expect( normalizeCueTimestamp( '01:02.500' ) ).toBe( '00:01:02.500' );
		expect( normalizeCueTimestamp( '00:01:02,500' ) ).toBe( '00:01:02.500' );
	} );

	it( 'carries rounded milliseconds into the next second', () => {
		expect( formatSecondsAsTimestamp( 1.9996 ) ).toBe( '00:00:02.000' );
		expect( formatSecondsAsTimestamp( 3599.9996 ) ).toBe( '01:00:00.000' );
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

	it( 'validates missing cue text and timestamps', () => {
		expect(
			getCaptionCueValidationErrors( [
				{
					name: CAPTION_CUE_BLOCK_NAME,
					attributes: {
						startTime: '',
						endTime: '2',
						text: '',
					},
				},
			] )
		).toEqual( [
			{ code: 'missing_text', cueNumber: 1 },
			{ code: 'missing_time', cueNumber: 1 },
		] );
	} );

	it( 'validates invalid and reversed cue timestamps', () => {
		expect(
			getCaptionCueValidationErrors( [
				{
					name: CAPTION_CUE_BLOCK_NAME,
					attributes: {
						startTime: 'not-time',
						endTime: '2',
						text: 'Hello',
					},
				},
				{
					name: CAPTION_CUE_BLOCK_NAME,
					attributes: {
						startTime: '5',
						endTime: '4',
						text: 'World',
					},
				},
			] )
		).toEqual( [
			{ code: 'invalid_time', cueNumber: 1 },
			{ code: 'end_before_start', cueNumber: 2 },
		] );
	} );

	it( 'validates overlapping cue timings', () => {
		expect(
			getCaptionCueValidationErrors( [
				{
					name: CAPTION_CUE_BLOCK_NAME,
					attributes: {
						startTime: '1',
						endTime: '5',
						text: 'Hello',
					},
				},
				{
					name: CAPTION_CUE_BLOCK_NAME,
					attributes: {
						startTime: '4',
						endTime: '6',
						text: 'World',
					},
				},
			] )
		).toEqual( [ { code: 'overlap', cueNumber: 2, previousCueNumber: 1 } ] );
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

	it( 'sanitizes cue text that looks like an HTML comment end', () => {
		expect(
			serializeCuesToWebVtt( [
				{
					startTime: '0',
					endTime: '2.5',
					text: 'Do not emit --> or --!> inside cue text.',
				},
			] )
		).toBe( 'WEBVTT\n\n00:00:00.000 --> 00:00:02.500\nDo not emit -> or -> inside cue text.\n' );
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

	it( 'converts transcript-like text into editable cue placeholders', () => {
		expect( parseCaptionTranscript( 'Trail closed.\nTrail open.' ) ).toEqual( [
			{ startTime: '00:00:00.000', endTime: '00:00:04.000', text: 'Trail closed.' },
			{ startTime: '00:00:04.000', endTime: '00:00:08.000', text: 'Trail open.' },
		] );
	} );

	it( 'prefers timed cues when parsing pasted caption text', () => {
		expect( parseCaptionTextInput( '00:00:01.000 --> 00:00:02.000\nTimed cue.' ) ).toEqual( [
			{ startTime: '00:00:01.000', endTime: '00:00:02.000', text: 'Timed cue.' },
		] );
	} );
} );
