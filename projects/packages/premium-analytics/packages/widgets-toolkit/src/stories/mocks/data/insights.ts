/**
 * Raw `stats/insights` response (pre-sanitizer shape), populated so every widget
 * built on this endpoint renders fully in Storybook: a clear peak day and hour
 * for the Most popular time widget, and more than one year for the Year in
 * review widget (so its year dropdown has a second entry to switch to). The
 * endpoint reports across the whole site lifetime and has no comparison period.
 */
// Relative to today so the Year in review widget, which defaults to the
// current year, keeps rendering data after New Year.
const CURRENT_YEAR = new Date().getFullYear();

export const mockStatsInsightsData = {
	highest_hour: 18,
	highest_hour_percent: 30,
	highest_day_of_week: 4,
	highest_day_percent: 22,
	hourly_views: {},
	years: [
		{
			year: String( CURRENT_YEAR - 1 ),
			total_posts: 96,
			total_comments: 214,
			avg_comments: 2.2,
			total_likes: 4120,
			avg_likes: 42.9,
			total_words: 61200,
			avg_words: 637,
		},
		{
			year: String( CURRENT_YEAR ),
			total_posts: 128,
			total_comments: 342,
			avg_comments: 2.7,
			total_likes: 5820,
			avg_likes: 45.5,
			total_words: 86400,
			avg_words: 675,
		},
	],
};
