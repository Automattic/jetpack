import {
	CAPTION_CUE_BLOCK_NAME,
	captionBlocksToCues,
	formatSecondsAsTimestamp,
	getCaptionCueValidationErrors,
	normalizeCueTimestamp,
	parseCaptionTextInput,
	parseCaptionTextTrack,
	parseCaptionTranscript,
	parseTimestampToSeconds,
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

	it( 'collapses blank lines inside cue text so a round-trip keeps the whole cue', () => {
		const vtt = serializeCuesToWebVtt( [
			{
				startTime: '0',
				endTime: '2.5',
				text: 'First line.\n\nSecond line.',
			},
		] );

		expect( vtt ).toBe( 'WEBVTT\n\n00:00:00.000 --> 00:00:02.500\nFirst line.\nSecond line.\n' );
		// Without the collapse the blank line would split the cue and the second
		// line would be dropped on parse; assert it survives the round-trip.
		expect( parseCaptionTextTrack( vtt ) ).toEqual( [
			{ startTime: '00:00:00.000', endTime: '00:00:02.500', text: 'First line.\nSecond line.' },
		] );
	} );

	it( 'skips cues with an invalid time range instead of emitting a malformed line', () => {
		expect(
			serializeCuesToWebVtt( [
				{ startTime: 'not-time', endTime: '2', text: 'Dropped.' },
				{ startTime: '3', endTime: '5', text: 'Kept.' },
			] )
		).toBe( 'WEBVTT\n\n00:00:03.000 --> 00:00:05.000\nKept.\n' );
	} );

	it( 'rejects malformed and out-of-range timestamps', () => {
		expect( parseTimestampToSeconds( '00:01:02.500' ) ).toBe( 62.5 );
		expect( parseTimestampToSeconds( '90' ) ).toBe( 90 );
		expect( parseTimestampToSeconds( '01:30' ) ).toBe( 90 );
		expect( parseTimestampToSeconds( ':30' ) ).toBeNull();
		expect( parseTimestampToSeconds( '60:00' ) ).toBeNull();
		expect( parseTimestampToSeconds( '00:99:99.000' ) ).toBeNull();
		expect( parseTimestampToSeconds( '-1:30' ) ).toBeNull();
	} );

	it( 'silently drops cues with unparseable timestamps but keeps the valid ones', () => {
		expect(
			parseCaptionTextTrack(
				'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nGood\n\n99:99:99.999 --> 99:99:99.999\nBad'
			)
		).toEqual( [ { startTime: '00:00:01.000', endTime: '00:00:02.000', text: 'Good' } ] );
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

	it( 'normalizes CRLF input so multi-line cue text carries no stray carriage returns', () => {
		expect(
			parseCaptionTextTrack(
				'1\r\n00:00:01,000 --> 00:00:02,000\r\nFirst line.\r\nSecond line.\r\n\r\n2\r\n00:00:03,000 --> 00:00:04,000\r\nWorld'
			)
		).toEqual( [
			{ startTime: '00:00:01.000', endTime: '00:00:02.000', text: 'First line.\nSecond line.' },
			{ startTime: '00:00:03.000', endTime: '00:00:04.000', text: 'World' },
		] );
	} );

	it( 'parses cues with a non-numeric identifier line', () => {
		expect( parseCaptionTextTrack( 'intro\n00:00:01.000 --> 00:00:02.000\ntext' ) ).toEqual( [
			{ startTime: '00:00:01.000', endTime: '00:00:02.000', text: 'text' },
		] );
	} );

	it( 'round-trips timestamps at 100 hours or more', () => {
		const timestamp = formatSecondsAsTimestamp( 100 * 3600 + 62.5 );
		expect( timestamp ).toBe( '100:01:02.500' );

		expect(
			parseCaptionTextTrack( `WEBVTT\n\n${ timestamp } --> 101:00:00.000\nLong stream.` )
		).toEqual( [ { startTime: timestamp, endTime: '101:00:00.000', text: 'Long stream.' } ] );
	} );

	it( 'round-trips multiple cues through serialize and parse unchanged', () => {
		const cues = [
			{ startTime: '00:00:01.000', endTime: '00:00:02.500', text: 'First cue.' },
			{ startTime: '00:00:03.000', endTime: '00:00:04.000', text: 'Second cue.\nWith two lines.' },
			{ startTime: '100:00:00.000', endTime: '100:00:05.000', text: 'Third cue.' },
		];

		expect( parseCaptionTextTrack( serializeCuesToWebVtt( cues ) ) ).toEqual( cues );
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

	it( 'keeps timing lines out of the transcript fallback when every timed cue is invalid', () => {
		const cues = parseCaptionTextInput(
			'WEBVTT\n\n99:99:99.999 --> 99:99:99.999\nFirst line.\n\n99:99:99.999 --> 99:99:99.999\nSecond line.'
		);

		expect( cues.map( cue => cue.text ) ).toEqual( [ 'First line.', 'Second line.' ] );
		expect( cues.some( cue => cue.text.includes( '-->' ) ) ).toBe( false );
	} );
} );
