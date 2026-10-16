import { parseDescription, serializeDescription, validateRows } from '..';
import type { ChapterRow, ChapterValidationCode } from '..';

const codes = ( rows: ChapterRow[], durationSeconds?: number ): ChapterValidationCode[] =>
	validateRows( rows, durationSeconds ).issues.map( issue => issue.code );

describe( 'parseDescription', () => {
	// Recognition cases ported from the legacy extract-video-chapters tests:
	// the same lines must classify identically here.
	it.each( [
		{
			line: '⌨️ (00:08:19) Course project (Survey app) demo',
			expected: { startAtSeconds: 499, title: 'Course project (Survey app) demo' },
		},
		{
			line: 'Install and Getting started (00:11:54) ⌨️',
			expected: { startAtSeconds: 714, title: 'Install and Getting started' },
		},
		{
			line: '00:27 What is React',
			expected: { startAtSeconds: 27, title: 'What is React' },
		},
		{
			line: 'Playing With Bun Deployment - 2:15',
			expected: { startAtSeconds: 135, title: 'Playing With Bun Deployment' },
		},
		{
			line: '(04:55) - Things Bun Does Fast',
			expected: { startAtSeconds: 295, title: 'Things Bun Does Fast' },
		},
		{
			line: '1:02:03 Deep dive',
			expected: { startAtSeconds: 3723, title: 'Deep dive' },
		},
	] )( 'recognizes $line', ( { line, expected } ) => {
		expect( parseDescription( line ) ).toStrictEqual( {
			rows: [ expected ],
			hasChapterLines: true,
		} );
	} );

	it( 'returns no rows for prose or an empty description', () => {
		expect( parseDescription( '' ) ).toStrictEqual( { rows: [], hasChapterLines: false } );
		expect( parseDescription( 'Not a chapter' ) ).toStrictEqual( {
			rows: [],
			hasChapterLines: false,
		} );
		expect( parseDescription( 'Line one.\n\nLine two.' ) ).toStrictEqual( {
			rows: [],
			hasChapterLines: false,
		} );
	} );

	it( 'keeps rows in document order instead of sorting like the legacy extractor', () => {
		const text = [ '2:30 Second', '0:00 First', '10:00 Third' ].join( '\n' );

		expect( parseDescription( text ).rows ).toStrictEqual( [
			{ startAtSeconds: 150, title: 'Second' },
			{ startAtSeconds: 0, title: 'First' },
			{ startAtSeconds: 600, title: 'Third' },
		] );
	} );

	it( 'skips prose lines interleaved with chapter lines', () => {
		const text = [
			'Intro prose.',
			'0:00 Start',
			'Some note here.',
			'2:30 Middle',
			'',
			'Outro prose.',
		].join( '\n' );

		expect( parseDescription( text ) ).toStrictEqual( {
			rows: [
				{ startAtSeconds: 0, title: 'Start' },
				{ startAtSeconds: 150, title: 'Middle' },
			],
			hasChapterLines: true,
		} );
	} );

	it( 'parses a bare timestamp line as a row with an empty title', () => {
		expect( parseDescription( '00:30' ).rows ).toStrictEqual( [
			{ startAtSeconds: 30, title: '' },
		] );
	} );
} );

describe( 'serializeDescription', () => {
	describe( 'same row count: in-place replacement', () => {
		it( 'rewrites only the recognized lines and byte-preserves prose', () => {
			const text = [
				'Intro prose.  ', // trailing spaces must survive
				'',
				'0:00 Start',
				'2:30 Middle',
				'',
				'Outro prose.',
			].join( '\n' );

			const result = serializeDescription( text, [
				{ startAtSeconds: 0, title: 'Start' },
				{ startAtSeconds: 90, title: 'Halfway' },
			] );

			expect( result ).toBe(
				[ 'Intro prose.  ', '', '00:00 Start', '01:30 Halfway', '', 'Outro prose.' ].join( '\n' )
			);
		} );

		it( 'normalizes exotic recognized forms when re-serializing unchanged rows', () => {
			const text = [
				'⌨️ (00:08:19) Course project demo',
				'Install and Getting started (00:11:54) ⌨️',
				'(14:55) - Things Bun Does Fast',
			].join( '\n' );

			const result = serializeDescription( text, parseDescription( text ).rows );

			expect( result ).toBe(
				[
					'08:19 Course project demo',
					'11:54 Install and Getting started',
					'14:55 Things Bun Does Fast',
				].join( '\n' )
			);
		} );

		it( 'formats hour-long start times as H:MM:SS', () => {
			expect(
				serializeDescription( '0:00 Intro', [ { startAtSeconds: 3661, title: 'Q&A' } ] )
			).toBe( '1:01:01 Q&A' );
		} );

		it( 'writes a bare timestamp for an empty title', () => {
			expect( serializeDescription( '0:00 Intro', [ { startAtSeconds: 30, title: '' } ] ) ).toBe(
				'00:30'
			);
		} );

		it( 'returns prose-only text unchanged when rows are empty', () => {
			const text = 'Just prose.\n\nMore prose.';

			expect( serializeDescription( text, [] ) ).toBe( text );
		} );
	} );

	describe( 'row count changed: reflow at the first chapter line', () => {
		it( 'inserts the grown block where the old block started', () => {
			const text = [ 'Intro prose.', '', '0:00 Start', '2:30 Middle', '', 'Outro prose.' ].join(
				'\n'
			);

			const result = serializeDescription( text, [
				{ startAtSeconds: 0, title: 'Start' },
				{ startAtSeconds: 150, title: 'Middle' },
				{ startAtSeconds: 600, title: 'End' },
			] );

			expect( result ).toBe(
				[ 'Intro prose.', '', '00:00 Start', '02:30 Middle', '10:00 End', '', 'Outro prose.' ].join(
					'\n'
				)
			);
		} );

		it( 'inserts at position zero when the description starts with chapters', () => {
			const text = [ '0:00 One', 'Some note here.', '1:00 Two' ].join( '\n' );

			const result = serializeDescription( text, [
				{ startAtSeconds: 0, title: 'One' },
				{ startAtSeconds: 60, title: 'Two' },
				{ startAtSeconds: 120, title: 'Three' },
			] );

			// Interleaved prose is pushed after the reflowed block.
			expect( result ).toBe(
				[ '00:00 One', '01:00 Two', '02:00 Three', 'Some note here.' ].join( '\n' )
			);
		} );

		it( 'shrinks the block in place when rows are removed', () => {
			const text = [ 'Intro.', '0:00 A', '0:30 B', '1:00 C', 'Outro.' ].join( '\n' );

			const result = serializeDescription( text, [
				{ startAtSeconds: 0, title: 'A' },
				{ startAtSeconds: 60, title: 'C' },
			] );

			expect( result ).toBe( [ 'Intro.', '00:00 A', '01:00 C', 'Outro.' ].join( '\n' ) );
		} );

		it( 'removes every chapter line when rows become empty, preserving blank lines', () => {
			const text = [ 'Intro prose.', '', '0:00 Start', '2:30 Middle', '', 'Outro prose.' ].join(
				'\n'
			);

			expect( serializeDescription( text, [] ) ).toBe(
				[ 'Intro prose.', '', '', 'Outro prose.' ].join( '\n' )
			);
		} );

		it( 'handles chapters at the bottom of the description', () => {
			const text = [ 'Prose first.', '', '0:00 A', '0:30 B' ].join( '\n' );

			const result = serializeDescription( text, [
				{ startAtSeconds: 0, title: 'A' },
				{ startAtSeconds: 30, title: 'B' },
				{ startAtSeconds: 60, title: 'C' },
			] );

			expect( result ).toBe( [ 'Prose first.', '', '00:00 A', '00:30 B', '01:00 C' ].join( '\n' ) );
		} );
	} );

	describe( 'no chapter lines: append after a blank line', () => {
		const rows: ChapterRow[] = [
			{ startAtSeconds: 0, title: 'A' },
			{ startAtSeconds: 30, title: 'B' },
			{ startAtSeconds: 60, title: 'C' },
		];
		const block = [ '00:00 A', '00:30 B', '01:00 C' ].join( '\n' );

		it( 'returns just the block for an empty description', () => {
			expect( serializeDescription( '', rows ) ).toBe( block );
		} );

		it( 'inserts a blank separator line after prose', () => {
			expect( serializeDescription( 'Just prose.', rows ) ).toBe( `Just prose.\n\n${ block }` );
		} );

		it( 'reuses a trailing newline as part of the separator', () => {
			expect( serializeDescription( 'Just prose.\n', rows ) ).toBe( `Just prose.\n\n${ block }` );
		} );

		it( 'adds no extra separator when a blank line is already there', () => {
			expect( serializeDescription( 'Just prose.\n\n', rows ) ).toBe( `Just prose.\n\n${ block }` );
		} );
	} );

	describe( 'round-trip: parse( serialize( text, rows ) ).rows === rows', () => {
		const roundTrip = ( text: string, rows: ChapterRow[] ) =>
			parseDescription( serializeDescription( text, rows ) ).rows;

		it.each( [
			{
				name: 'plain replacement',
				text: '0:00 Old\n2:00 Older',
				rows: [
					{ startAtSeconds: 0, title: 'Intro' },
					{ startAtSeconds: 120, title: 'Body' },
				],
			},
			{
				name: 'growth with surrounding prose',
				text: 'Intro.\n\n0:00 Old\n\nOutro.',
				rows: [
					{ startAtSeconds: 0, title: 'Intro' },
					{ startAtSeconds: 45, title: 'Middle' },
					{ startAtSeconds: 3723, title: 'Hour mark' },
				],
			},
			{
				name: 'append to prose-only text',
				text: 'Only prose here.',
				rows: [
					{ startAtSeconds: 0, title: 'A' },
					{ startAtSeconds: 30, title: 'B' },
					{ startAtSeconds: 60, title: 'C' },
				],
			},
			{
				name: 'titles containing timestamps and parentheses',
				text: '',
				rows: [
					{ startAtSeconds: 0, title: 'Intro' },
					{ startAtSeconds: 300, title: 'Recap of 2:30 segment' },
					{ startAtSeconds: 900, title: 'Demo (04:55) walkthrough' },
				],
			},
			{
				name: 'empty titles',
				text: '',
				rows: [
					{ startAtSeconds: 0, title: 'Intro' },
					{ startAtSeconds: 30, title: '' },
					{ startAtSeconds: 60, title: 'End' },
				],
			},
		] )( 'round-trips $name', ( { text, rows } ) => {
			expect( roundTrip( text, rows ) ).toStrictEqual( rows );
		} );

		it( 'round-trips titles with dashes/whitespace to their normal form', () => {
			// The legacy extractor strips one leading '- ' / trailing ' -' and
			// trims, so serialize writes the fixpoint of that rule.
			const rows = [
				{ startAtSeconds: 0, title: '  padded  ' },
				{ startAtSeconds: 30, title: '- leading dash' },
				{ startAtSeconds: 60, title: 'trailing dash -' },
				{ startAtSeconds: 90, title: '- both - ' },
			];

			expect( roundTrip( '', rows ) ).toStrictEqual( [
				{ startAtSeconds: 0, title: 'padded' },
				{ startAtSeconds: 30, title: 'leading dash' },
				{ startAtSeconds: 60, title: 'trailing dash' },
				{ startAtSeconds: 90, title: 'both' },
			] );
		} );

		it( 'is identity on already-normalized descriptions', () => {
			const text = [ 'Intro prose.', '', '00:00 Start', '02:30 Middle', '', 'Outro.' ].join( '\n' );

			expect( serializeDescription( text, parseDescription( text ).rows ) ).toBe( text );
		} );
	} );
} );

describe( 'validateRows', () => {
	// Base cases ported from the legacy validate-chapters tests.
	it( 'rejects an empty row list', () => {
		expect( validateRows( [] ) ).toStrictEqual( {
			isValid: false,
			issues: [ { code: 'no-chapters', message: expect.any( String ) } ],
		} );
	} );

	it( 'rejects a first chapter that does not start at 0:00', () => {
		const rows = [
			{ startAtSeconds: 1, title: 'Chapter 1' },
			{ startAtSeconds: 11, title: 'Chapter 2' },
			{ startAtSeconds: 21, title: 'Chapter 3' },
		];

		expect( codes( rows ) ).toStrictEqual( [ 'first-not-zero' ] );
		expect( validateRows( rows ).issues[ 0 ].rowIndex ).toBe( 0 );
	} );

	it( 'rejects fewer than three chapters', () => {
		const rows = [
			{ startAtSeconds: 0, title: 'Chapter 1' },
			{ startAtSeconds: 10, title: 'Chapter 2' },
		];

		expect( codes( rows ) ).toStrictEqual( [ 'too-few-chapters' ] );
	} );

	it( 'rejects chapters without a title', () => {
		const rows = [
			{ startAtSeconds: 0, title: 'Chapter 1' },
			{ startAtSeconds: 10, title: '' },
			{ startAtSeconds: 20, title: 'Chapter 3' },
		];
		const result = validateRows( rows );

		expect( codes( rows ) ).toStrictEqual( [ 'missing-title' ] );
		expect( result.issues[ 0 ].rowIndex ).toBe( 1 );
	} );

	it( 'treats a whitespace-only title as missing', () => {
		const rows = [
			{ startAtSeconds: 0, title: 'Chapter 1' },
			{ startAtSeconds: 10, title: '   ' },
			{ startAtSeconds: 20, title: 'Chapter 3' },
		];

		expect( codes( rows ) ).toStrictEqual( [ 'missing-title' ] );
	} );

	it( 'rejects chapters closer than 10 seconds', () => {
		const rows = [
			{ startAtSeconds: 0, title: 'Chapter 1' },
			{ startAtSeconds: 12, title: 'Chapter 2' },
			{ startAtSeconds: 13, title: 'Chapter 3' },
		];
		const result = validateRows( rows );

		expect( codes( rows ) ).toStrictEqual( [ 'too-close' ] );
		expect( result.issues[ 0 ].rowIndex ).toBe( 2 );
	} );

	it( 'accepts a valid set of chapters', () => {
		const rows = [
			{ startAtSeconds: 0, title: 'Chapter 1' },
			{ startAtSeconds: 10, title: 'Chapter 2' },
			{ startAtSeconds: 25, title: 'Chapter 3' },
		];

		expect( validateRows( rows, 30 ) ).toStrictEqual( { isValid: true, issues: [] } );
	} );

	// Rules added on top of the legacy set.
	it( 'rejects duplicate timestamps as not ascending', () => {
		const rows = [
			{ startAtSeconds: 0, title: 'Chapter 1' },
			{ startAtSeconds: 20, title: 'Chapter 2' },
			{ startAtSeconds: 20, title: 'Chapter 3' },
		];

		expect( codes( rows ) ).toStrictEqual( [ 'not-ascending' ] );
	} );

	it( 'rejects out-of-order timestamps without also flagging the gap', () => {
		const rows = [
			{ startAtSeconds: 0, title: 'Chapter 1' },
			{ startAtSeconds: 30, title: 'Chapter 2' },
			{ startAtSeconds: 20, title: 'Chapter 3' },
		];
		const result = validateRows( rows );

		expect( codes( rows ) ).toStrictEqual( [ 'not-ascending' ] );
		expect( result.issues[ 0 ].rowIndex ).toBe( 2 );
	} );

	it( 'rejects chapters starting after the video ends', () => {
		const rows = [
			{ startAtSeconds: 0, title: 'Chapter 1' },
			{ startAtSeconds: 15, title: 'Chapter 2' },
			{ startAtSeconds: 40, title: 'Chapter 3' },
		];
		const result = validateRows( rows, 30 );

		expect( codes( rows, 30 ) ).toStrictEqual( [ 'exceeds-duration' ] );
		expect( result.issues[ 0 ].rowIndex ).toBe( 2 );
	} );

	it( 'accepts a chapter starting exactly at the video end', () => {
		const rows = [
			{ startAtSeconds: 0, title: 'Chapter 1' },
			{ startAtSeconds: 15, title: 'Chapter 2' },
			{ startAtSeconds: 30, title: 'Chapter 3' },
		];

		expect( validateRows( rows, 30 ).isValid ).toBe( true );
	} );

	it( 'skips the duration check when the duration is unknown or zero', () => {
		const rows = [
			{ startAtSeconds: 0, title: 'Chapter 1' },
			{ startAtSeconds: 15, title: 'Chapter 2' },
			{ startAtSeconds: 4000, title: 'Chapter 3' },
		];

		expect( validateRows( rows ).isValid ).toBe( true );
		expect( validateRows( rows, 0 ).isValid ).toBe( true );
	} );

	it( 'accumulates every violation across rules', () => {
		const rows = [
			{ startAtSeconds: 5, title: '' },
			{ startAtSeconds: 6, title: 'Chapter 2' },
		];

		expect( codes( rows, 4 ).sort() ).toStrictEqual(
			[
				'exceeds-duration',
				'exceeds-duration',
				'first-not-zero',
				'missing-title',
				'too-close',
				'too-few-chapters',
			].sort()
		);
	} );

	it( 'exposes translated messages on every issue', () => {
		for ( const issue of validateRows( [ { startAtSeconds: 5, title: '' } ], 4 ).issues ) {
			expect( typeof issue.message ).toBe( 'string' );
			expect( issue.message.length ).toBeGreaterThan( 0 );
		}
	} );
} );
