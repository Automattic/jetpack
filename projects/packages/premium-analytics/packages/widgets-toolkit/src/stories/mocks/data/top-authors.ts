// Inline SVG avatar so stories stay deterministic and offline (no network
// request to Gravatar). A hue derived from the seed keeps each author distinct.
const avatar = ( seed: string ) => {
	let hue = 0;
	for ( let i = 0; i < seed.length; i++ ) {
		hue = ( hue * 31 + seed.charCodeAt( i ) ) % 360;
	}
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="hsl(${ hue } 55% 65%)"/></svg>`;
	return `data:image/svg+xml,${ encodeURIComponent( svg ) }`;
};

const post = ( id: number, title: string, views: number ) => ( {
	id,
	title,
	url: `https://example.com/posts/${ id }`,
	views,
	video: false,
} );

export const mockTopAuthorsData = {
	date: '2026-06-22',
	period: 'month',
	summary: {
		authors: [
			{
				author_id: 101,
				name: 'Jane Cooper',
				avatar: avatar( 'Jane Cooper' ),
				views: 4820,
				posts: [
					post( 1001, 'Jane Cooper: Getting started', 2410 ),
					post( 1002, 'Jane Cooper: A deeper dive', 1446 ),
					post( 1003, 'Jane Cooper: Lessons learned', 964 ),
				],
			},
			{
				author_id: 102,
				name: 'Wade Warren',
				avatar: avatar( 'Wade Warren' ),
				views: 3110,
				posts: [
					post( 2001, 'Wade Warren: Getting started', 1555 ),
					post( 2002, 'Wade Warren: A deeper dive', 933 ),
					post( 2003, 'Wade Warren: Lessons learned', 622 ),
				],
			},
			{
				author_id: 103,
				name: 'Esther Howard',
				avatar: avatar( 'Esther Howard' ),
				views: 2540,
				posts: [
					post( 3001, 'Esther Howard: Getting started', 1270 ),
					post( 3002, 'Esther Howard: A deeper dive', 762 ),
					post( 3003, 'Esther Howard: Lessons learned', 508 ),
				],
			},
			{
				author_id: 104,
				name: 'Cameron Williamson',
				avatar: avatar( 'Cameron Williamson' ),
				views: 1890,
				posts: [
					post( 4001, 'Cameron Williamson: Getting started', 945 ),
					post( 4002, 'Cameron Williamson: A deeper dive', 567 ),
					post( 4003, 'Cameron Williamson: Lessons learned', 378 ),
				],
			},
			{
				author_id: 105,
				name: 'Brooklyn Simmons',
				avatar: avatar( 'Brooklyn Simmons' ),
				views: 1320,
				posts: [
					post( 5001, 'Brooklyn Simmons: Getting started', 660 ),
					post( 5002, 'Brooklyn Simmons: A deeper dive', 396 ),
					post( 5003, 'Brooklyn Simmons: Lessons learned', 264 ),
				],
			},
			{
				author_id: 106,
				name: 'Leslie Alexander',
				avatar: avatar( 'Leslie Alexander' ),
				views: 760,
				posts: [
					post( 6001, 'Leslie Alexander: Getting started', 380 ),
					post( 6002, 'Leslie Alexander: A deeper dive', 228 ),
					post( 6003, 'Leslie Alexander: Lessons learned', 152 ),
				],
			},
			{
				name: '',
				views: 410,
				posts: [],
			},
		],
	},
};

export const mockTopAuthorsComparisonData = {
	date: '2026-05-22',
	period: 'month',
	summary: {
		authors: [
			{
				author_id: 101,
				name: 'Jane Cooper',
				avatar: avatar( 'Jane Cooper' ),
				views: 3900,
				posts: [
					post( 1001, 'Jane Cooper: Getting started', 2145 ),
					post( 1002, 'Jane Cooper: A deeper dive', 1170 ),
					post( 1099, 'Jane Cooper: Earlier update', 585 ),
				],
			},
			{
				author_id: 102,
				name: 'Wade Warren',
				avatar: avatar( 'Wade Warren' ),
				views: 3540,
				posts: [
					post( 2001, 'Wade Warren: Getting started', 1770 ),
					post( 2002, 'Wade Warren: A deeper dive', 1062 ),
					post( 2003, 'Wade Warren: Lessons learned', 708 ),
				],
			},
			{
				author_id: 103,
				name: 'Esther Howard',
				avatar: avatar( 'Esther Howard' ),
				views: 1980,
				posts: [
					post( 3001, 'Esther Howard: Getting started', 990 ),
					post( 3002, 'Esther Howard: A deeper dive', 594 ),
					post( 3003, 'Esther Howard: Lessons learned', 396 ),
				],
			},
			{
				author_id: 104,
				name: 'Cameron Williamson',
				avatar: avatar( 'Cameron Williamson' ),
				views: 2010,
				posts: [
					post( 4001, 'Cameron Williamson: Getting started', 1005 ),
					post( 4002, 'Cameron Williamson: A deeper dive', 603 ),
					post( 4003, 'Cameron Williamson: Lessons learned', 402 ),
				],
			},
		],
	},
};
