/**
 * Mock response for the Jetpack Stats single-video module (`stats/video/%d`),
 * so the video detail widgets render populated in Storybook. The shape matches
 * what `sanitizeStatsSingleVideoResponse` reads: `data` is a `[ date, plays ]`
 * time series and `pages` is the list of URLs where the video is embedded.
 *
 * The mock generates a deterministic ~400-day daily series ending today (a
 * weekly wave over slow growth), so the dashboard's relative date presets
 * always intersect it regardless of when the story runs, and a comparison
 * window earlier than the primary one reads lower.
 */

import { format, subDays } from 'date-fns';

const DAY_FORMAT = 'yyyy-MM-dd';
const SERIES_DAYS = 400;

const seriesEnd = new Date();

const mockSingleVideoDailyViews: Array< [ string, number ] > = Array.from(
	{ length: SERIES_DAYS },
	( _, index ) => {
		const date = subDays( seriesEnd, SERIES_DAYS - 1 - index );
		const growth = Math.round( index / 5 );
		const weeklyWave = 34 + Math.round( 16 * Math.sin( ( ( index % 7 ) / 7 ) * Math.PI * 2 ) );

		return [ format( date, DAY_FORMAT ), Math.max( 3, weeklyWave + growth ) ];
	}
);

export const mockSingleVideoData = {
	data: mockSingleVideoDailyViews,
	post: {
		ID: 105,
		post_title: 'Behind the Scenes',
		post_date: '2026-06-10 09:00:00',
		post_mime_type: 'video/videopress',
		poster: 'https://i0.wp.com/videos.files.wordpress.com/abcd1234/behind-the-scenes.jpg',
	},
	pages: [
		'https://example.com/getting-started-walkthrough/',
		'https://example.com/2026/06/product-launch-highlights/',
		'https://example.com/tutorials/advanced-settings/',
		'https://example.com/about/behind-the-scenes/',
		'https://example.com/blog/weekly-recap/',
	],
};
