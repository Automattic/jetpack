/**
 * Internal dependencies
 */
import applyChaptersToDescription from '../index';

const CHAPTERS = [
	{ seconds: 0, title: 'Intro' },
	{ seconds: 84, title: 'Mountains arise' },
	{ seconds: 184, title: 'Credits' },
];

describe( 'applyChaptersToDescription', () => {
	it( 'appends a chapter block to a description without chapter lines', () => {
		expect( applyChaptersToDescription( 'A video about mountains.', CHAPTERS ) ).toBe(
			'A video about mountains.\n\n00:00 Intro\n01:24 Mountains arise\n03:04 Credits'
		);
	} );

	it( 'fills an empty description with just the chapter block', () => {
		expect( applyChaptersToDescription( '', CHAPTERS ) ).toBe(
			'00:00 Intro\n01:24 Mountains arise\n03:04 Credits'
		);
	} );

	it( 'replaces existing chapter lines in place, keeping surrounding prose', () => {
		const description = 'Intro text.\n00:00 Old intro\n00:30 Old middle\nOutro text.';
		expect( applyChaptersToDescription( description, CHAPTERS ) ).toBe(
			'Intro text.\n00:00 Intro\n01:24 Mountains arise\n03:04 Credits\nOutro text.'
		);
	} );

	it( 'collects scattered chapter lines into one block at the first occurrence', () => {
		const description = '00:00 One\nprose between\n00:30 Two';
		expect( applyChaptersToDescription( description, CHAPTERS ) ).toBe(
			'00:00 Intro\n01:24 Mountains arise\n03:04 Credits\nprose between'
		);
	} );

	it( 'removes chapter lines entirely when saving an empty chapter list', () => {
		const description = 'Intro text.\n00:00 Old intro\n00:30 Old middle\nOutro text.';
		expect( applyChaptersToDescription( description, [] ) ).toBe( 'Intro text.\nOutro text.' );
	} );

	it( 'uses H:MM:SS lines for chapters beyond one hour', () => {
		const chapters = [
			{ seconds: 0, title: 'Start' },
			{ seconds: 1800, title: 'Middle' },
			{ seconds: 3725, title: 'Late' },
		];
		expect( applyChaptersToDescription( '', chapters ) ).toBe(
			'00:00 Start\n30:00 Middle\n1:02:05 Late'
		);
	} );

	it( 'trims chapter titles', () => {
		expect( applyChaptersToDescription( '', [ { seconds: 0, title: '  Intro  ' } ] ) ).toBe(
			'00:00 Intro'
		);
	} );
} );
