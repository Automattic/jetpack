import { extractSingleChapter, extractVideoChapters } from '../extract-chapters';

describe( 'extractSingleChapter', () => {
	const testCases = [
		{
			line: '⌨️ (00:08:19) Course project (Survey app) demo',
			expectedResult: {
				startAt: '00:08:19',
				title: 'Course project (Survey app) demo',
			},
		},
		{
			line: 'Install and Getting started (00:11:54) ⌨️',
			expectedResult: {
				startAt: '00:11:54',
				title: 'Install and Getting started',
			},
		},
		{
			line: '00:27 What is React',
			expectedResult: {
				startAt: '00:27',
				title: 'What is React',
			},
		},
		{
			line: 'Playing With Bun Deployment - 2:15',
			expectedResult: {
				startAt: '02:15',
				title: 'Playing With Bun Deployment',
			},
		},
		{
			line: '(04:55) - Things Bun Does Fast',
			expectedResult: {
				startAt: '04:55',
				title: 'Things Bun Does Fast',
			},
		},
		{
			line: 'Not a chapter',
			expectedResult: null,
		},
	];

	it( 'extracts a chapter from a single line', () => {
		for ( const testCase of testCases ) {
			const result = extractSingleChapter( testCase.line );

			expect( result ).toStrictEqual( testCase.expectedResult );
		}
	} );
} );

describe( 'extractVideoChapters', () => {
	const testCase = {
		text: `0:00 Chapter 1
2:30 Chapter 2
10:00 Chapter 3
20:00 Chapter 5
37:00 Chapter 8
23:15 Chapter 6
24:00 Chapter 7
40:00 Chapter 9
45:00 Chapter 10
47:50 Chapter 11
49:30 Chapter 12
53:00 Chapter 13
15:00 Chapter 4
`,
		expectedResult: [
			{ startAt: '00:00', title: 'Chapter 1' },
			{ startAt: '02:30', title: 'Chapter 2' },
			{ startAt: '10:00', title: 'Chapter 3' },
			{ startAt: '15:00', title: 'Chapter 4' },
			{ startAt: '20:00', title: 'Chapter 5' },
			{ startAt: '23:15', title: 'Chapter 6' },
			{ startAt: '24:00', title: 'Chapter 7' },
			{ startAt: '37:00', title: 'Chapter 8' },
			{ startAt: '40:00', title: 'Chapter 9' },
			{ startAt: '45:00', title: 'Chapter 10' },
			{ startAt: '47:50', title: 'Chapter 11' },
			{ startAt: '49:30', title: 'Chapter 12' },
			{ startAt: '53:00', title: 'Chapter 13' },
		],
	};

	it( 'extracts all chapters from a video description text', () => {
		const result = extractVideoChapters( testCase.text );

		expect( result ).toStrictEqual( testCase.expectedResult );
	} );
} );
