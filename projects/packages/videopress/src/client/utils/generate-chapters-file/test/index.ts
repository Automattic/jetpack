import { generateChaptersFileContent } from '..';

describe( 'generateChaptersFileContent', () => {
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
00:04:44.001 --> 99:59:59.000
Chapter 3 - Revolutions
`;
			const result = generateChaptersFileContent( description );
			expect( result ).toBe( expectedResult );
		} );
	} );
} );
