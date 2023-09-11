import { generateChaptersFileContent } from '../generate-chapters-file';

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
