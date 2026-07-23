/**
 * Mock response for the Jetpack Stats single-video module (`stats/video/%d`),
 * so the "Video embeds" widget renders populated in Storybook. The shape matches
 * what `sanitizeStatsSingleVideoResponse` reads: `data` is a `[ date, plays ]`
 * time series and `pages` is the list of URLs where the video is embedded.
 */
export const mockSingleVideoData = {
	data: [
		[ '2026-06-16', 42 ],
		[ '2026-06-17', 58 ],
		[ '2026-06-18', 37 ],
		[ '2026-06-19', 61 ],
		[ '2026-06-20', 49 ],
		[ '2026-06-21', 73 ],
		[ '2026-06-22', 88 ],
	],
	pages: [
		'https://example.com/getting-started-walkthrough/',
		'https://example.com/2026/06/product-launch-highlights/',
		'https://example.com/tutorials/advanced-settings/',
		'https://example.com/about/behind-the-scenes/',
		'https://example.com/blog/weekly-recap/',
	],
};
