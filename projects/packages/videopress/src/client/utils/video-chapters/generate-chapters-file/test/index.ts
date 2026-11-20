import { generateChaptersFileContent } from '..';
import { extractVideoChapters } from '../../extract-video-chapters';
import validateChapters from '../../validate-chapters';

describe( 'generateChaptersFileContent', () => {
	it( 'preserves chapters with colons in titles through validation and WebVTT generation', () => {
		const description = `00:00 Background and agency hosting goals
03:08 Cloud dashboard monitoring
04:20 Backups: Pressable vs. Jetpack
05:29 VideoPress and the premium tier`;
		const chapters = extractVideoChapters( description );

		expect( chapters ).toStrictEqual( [
			{ startAt: '00:00:00', title: 'Background and agency hosting goals' },
			{ startAt: '00:03:08', title: 'Cloud dashboard monitoring' },
			{ startAt: '00:04:20', title: 'Backups: Pressable vs. Jetpack' },
			{ startAt: '00:05:29', title: 'VideoPress and the premium tier' },
		] );
		expect( validateChapters( chapters ) ).toBe( true );
		expect( generateChaptersFileContent( description, 360000 ) ).toContain( `
1
00:00:00.000 --> 00:03:08.000
Background and agency hosting goals

2
00:03:08.001 --> 00:04:20.000
Cloud dashboard monitoring

3
00:04:20.001 --> 00:05:29.000
Backups: Pressable vs. Jetpack

4
00:05:29.001 --> 00:06:00.000
VideoPress and the premium tier
` );
	} );

	describe( 'with video duration', () => {
		it( 'generates WebVTT file contents', () => {
			const description = `
0:00 Chapter 1
1:42 Chapter 2 - Reloaded
4:44 Chapter 3 - Revolutions
`;
			const videoDuration = 300000; // 5 minutes
			const expectedResult = `WEBVTT

NOTE
videopress-chapters-auto-generated
This file was auto-generated based on Video description.
For more information, see https://jetpack.com/support/jetpack-videopress/jetpack-videopress-customizing-your-videos/#adding-subtitles-captions-or-chapters-within-a-video

1
00:00:00.000 --> 00:01:42.000
Chapter 1

2
00:01:42.001 --> 00:04:44.000
Chapter 2 - Reloaded

3
00:04:44.001 --> 00:05:00.000
Chapter 3 - Revolutions
`;
			const result = generateChaptersFileContent( description, videoDuration );
			expect( result ).toBe( expectedResult );
		} );
	} );

	describe( 'without video duration', () => {
		it( 'generates WebVTT file contents with long end time', () => {
			const description = `
0:00 Chapter 1
1:42 Chapter 2 - Reloaded
4:44 Chapter 3 - Revolutions
`;
			const expectedResult = `WEBVTT

NOTE
videopress-chapters-auto-generated
This file was auto-generated based on Video description.
For more information, see https://jetpack.com/support/jetpack-videopress/jetpack-videopress-customizing-your-videos/#adding-subtitles-captions-or-chapters-within-a-video

1
00:00:00.000 --> 00:01:42.000
Chapter 1

2
00:01:42.001 --> 00:04:44.000
Chapter 2 - Reloaded

3
00:04:44.001 --> 999:59:59.000
Chapter 3 - Revolutions
`;
			const result = generateChaptersFileContent( description );
			expect( result ).toBe( expectedResult );
		} );
	} );
} );
