import validateChapters from '..';
/**
 * Types
 */
import type { VideoPressChapter } from '../../types';

describe( 'validateChapters', () => {
	it( 'should return false if there are no chapters', () => {
		expect( validateChapters( [] ) ).toBe( false );
	} );

	it( 'should return false if the first chapter does not start at 00:00:00', () => {
		const chapters: VideoPressChapter[] = [
			{ startAt: '00:00:01', title: 'Chapter 1' },
			{ startAt: '00:00:11', title: 'Chapter 2' },
			{ startAt: '00:00:21', title: 'Chapter 3' },
		];

		expect( validateChapters( chapters ) ).toBe( false );
	} );

	it( 'should return false if there are less than 3 chapters', () => {
		const chapters: VideoPressChapter[] = [
			{ startAt: '00:00:00', title: 'Chapter 1' },
			{ startAt: '00:00:10', title: 'Chapter 2' },
		];

		expect( validateChapters( chapters ) ).toBe( false );
	} );

	it( 'should return false if there is a chapter without a title', () => {
		const chapters: VideoPressChapter[] = [
			{ startAt: '00:00:00', title: 'Chapter 1' },
			{ startAt: '00:00:10', title: '' },
			{ startAt: '00:00:20', title: 'Chapter 3' },
		];

		expect( validateChapters( chapters ) ).toBe( false );
	} );

	it( 'should return false if there are less than 10 seconds between chapters', () => {
		const chapters: VideoPressChapter[] = [
			{ startAt: '00:00:00', title: 'Chapter 1' },
			{ startAt: '00:00:12', title: 'Chapter 2' },
			{ startAt: '00:00:13', title: 'Chapter 3' },
		];

		expect( validateChapters( chapters ) ).toBe( false );
	} );

	it( 'should return true if all the chapters are valid', () => {
		const chapters: VideoPressChapter[] = [
			{ startAt: '00:00:00', title: 'Chapter 1' },
			{ startAt: '00:00:10', title: 'Chapter 2' },
			{ startAt: '00:00:25', title: 'Chapter 3' },
		];

		expect( validateChapters( chapters ) ).toBe( true );
	} );
} );
