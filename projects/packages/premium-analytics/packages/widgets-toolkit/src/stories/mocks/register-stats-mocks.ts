/**
 * Stats API mock middleware for Storybook.
 *
 * Intercepts `@wordpress/api-fetch` requests to the PA Stats proxy and returns
 * fixture data so Stats-backed widgets render in Storybook without a live
 * WordPress + WPCOM connection.
 */
/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import type { APIFetchMiddleware, APIFetchOptions } from '@wordpress/api-fetch';

const STATS_BASE = '/jetpack-premium-analytics/v1/proxy/v1.1/stats';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const MOCK_CLICKS = {
	date: '2026-06-29',
	period: 'day',
	days: {},
	summary: {
		clicks: [
			{
				name: 'wordpress.org',
				views: 3840,
				icon: 'https://www.google.com/s2/favicons?domain=wordpress.org&sz=32',
				children: [
					{
						name: 'wordpress.org/plugins/jetpack-search',
						views: 2410,
						url: 'https://wordpress.org/plugins/jetpack-search',
					},
					{
						name: 'wordpress.org/plugins/jetpack-boost/',
						views: 1430,
						url: 'https://wordpress.org/plugins/jetpack-boost/',
					},
				],
			},
			{
				name: 'developer.wordpress.org',
				views: 2610,
				icon: 'https://www.google.com/s2/favicons?domain=developer.wordpress.org&sz=32',
				children: [
					{
						name: 'developer.wordpress.org/reference/functions/wp_remote_get',
						views: 1180,
						url: 'https://developer.wordpress.org/reference/functions/wp_remote_get/',
					},
					{
						name: 'developer.wordpress.org/rest-api/reference',
						views: 840,
						url: 'https://developer.wordpress.org/rest-api/reference/',
					},
					{
						name: 'developer.wordpress.org/block-editor/reference-guides',
						views: 590,
						url: 'https://developer.wordpress.org/block-editor/reference-guides/',
					},
				],
			},
			{
				name: 'jetpack.com',
				views: 1920,
				icon: 'https://www.google.com/s2/favicons?domain=jetpack.com&sz=32',
				children: [
					{
						name: 'jetpack.com/support',
						views: 910,
						url: 'https://jetpack.com/support/',
					},
					{
						name: 'jetpack.com/blog',
						views: 640,
						url: 'https://jetpack.com/blog/',
					},
					{
						name: 'jetpack.com/pricing',
						views: 370,
						url: 'https://jetpack.com/pricing/',
					},
				],
			},
			{
				name: 'woocommerce.com',
				views: 1305,
				icon: 'https://www.google.com/s2/favicons?domain=woocommerce.com&sz=32',
				children: [
					{
						name: 'woocommerce.com/documentation/plugins',
						views: 610,
						url: 'https://woocommerce.com/documentation/plugins/',
					},
					{
						name: 'woocommerce.com/products',
						views: 460,
						url: 'https://woocommerce.com/products/',
					},
					{
						name: 'woocommerce.com/posts',
						views: 235,
						url: 'https://woocommerce.com/posts/',
					},
				],
			},
			{
				name: 'example.com',
				views: 870,
				children: [
					{
						name: 'example.com/downloads/whitepaper.pdf',
						views: 530,
						url: 'https://example.com/downloads/whitepaper.pdf',
					},
					{
						name: 'example.com/demo',
						views: 340,
						url: 'https://example.com/demo/',
					},
				],
			},
		],
	},
};

const MOCK_CLICKS_COMPARISON = {
	date: '2026-05-30',
	period: 'day',
	days: {},
	summary: {
		clicks: [
			{
				name: 'wordpress.org',
				views: 3100,
				icon: 'https://www.google.com/s2/favicons?domain=wordpress.org&sz=32',
				children: [
					{
						name: 'wordpress.org/plugins/jetpack-search',
						views: 1980,
						url: 'https://wordpress.org/plugins/jetpack-search',
					},
					{
						name: 'wordpress.org/plugins/jetpack-boost/',
						views: 1120,
						url: 'https://wordpress.org/plugins/jetpack-boost/',
					},
				],
			},
			{
				name: 'developer.wordpress.org',
				views: 2940,
				icon: 'https://www.google.com/s2/favicons?domain=developer.wordpress.org&sz=32',
				children: [
					{
						name: 'developer.wordpress.org/reference/functions/wp_remote_get',
						views: 1410,
						url: 'https://developer.wordpress.org/reference/functions/wp_remote_get/',
					},
					{
						name: 'developer.wordpress.org/rest-api/reference',
						views: 870,
						url: 'https://developer.wordpress.org/rest-api/reference/',
					},
					{
						name: 'developer.wordpress.org/block-editor/reference-guides',
						views: 660,
						url: 'https://developer.wordpress.org/block-editor/reference-guides/',
					},
				],
			},
			{
				name: 'jetpack.com',
				views: 1270,
				icon: 'https://www.google.com/s2/favicons?domain=jetpack.com&sz=32',
				children: [
					{
						name: 'jetpack.com/support',
						views: 620,
						url: 'https://jetpack.com/support/',
					},
					{
						name: 'jetpack.com/blog',
						views: 410,
						url: 'https://jetpack.com/blog/',
					},
					{
						name: 'jetpack.com/pricing',
						views: 240,
						url: 'https://jetpack.com/pricing/',
					},
				],
			},
			{
				name: 'woocommerce.com',
				views: 980,
				icon: 'https://www.google.com/s2/favicons?domain=woocommerce.com&sz=32',
				children: [
					{
						name: 'woocommerce.com/documentation/plugins',
						views: 460,
						url: 'https://woocommerce.com/documentation/plugins/',
					},
					{
						name: 'woocommerce.com/products',
						views: 330,
						url: 'https://woocommerce.com/products/',
					},
					{
						name: 'woocommerce.com/posts',
						views: 190,
						url: 'https://woocommerce.com/posts/',
					},
				],
			},
		],
	},
};

// Exercises every referrer shape the widget renders: a multi-source group that
// drills down twice (group → source → domain), a single-result group (which the
// normalizer flattens into the result itself), and childless domains with URLs
// that render as outbound links (label + favicon), while rows with children
// drill down.
const MOCK_REFERRERS = {
	date: '2026-06-29',
	period: 'day',
	days: {},
	summary: {
		groups: [
			{
				group: 'Search Engines',
				name: 'Search Engines',
				icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=32',
				total: 4801,
				results: [
					{
						name: 'Google Search',
						icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=32',
						views: 3936,
						children: [
							{
								name: 'google.com',
								url: 'https://www.google.com/',
								views: 3760,
							},
							{
								name: 'google.co.uk',
								url: 'https://www.google.co.uk/',
								views: 176,
							},
						],
					},
					{
						name: 'Bing',
						icon: 'https://www.google.com/s2/favicons?domain=bing.com&sz=32',
						views: 542,
						children: [
							{
								name: 'bing.com',
								url: 'https://www.bing.com/',
								views: 542,
							},
						],
					},
					{
						name: 'DuckDuckGo',
						icon: 'https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=32',
						views: 323,
						children: [
							{
								name: 'duckduckgo.com',
								url: 'https://duckduckgo.com/',
								views: 323,
							},
						],
					},
				],
			},
			{
				group: 'WordPress.com Reader',
				name: 'WordPress.com Reader',
				icon: 'https://www.google.com/s2/favicons?domain=wordpress.com&sz=32',
				total: 1240,
				results: [
					{
						name: 'WordPress.com Reader',
						url: 'https://wordpress.com/read',
						views: 1240,
					},
				],
			},
			{
				group: 'twitter.com',
				name: 'twitter.com',
				url: 'https://twitter.com/',
				icon: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=32',
				total: 920,
				results: { views: 920 },
			},
			{
				group: 'linkedin.com',
				name: 'linkedin.com',
				url: 'https://www.linkedin.com/',
				icon: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=32',
				total: 610,
				results: { views: 610 },
			},
			{
				group: 'news.ycombinator.com',
				name: 'news.ycombinator.com',
				url: 'https://news.ycombinator.com/',
				total: 480,
				results: { views: 480 },
			},
		],
		other_views: 120,
		total_views: 8171,
	},
};

const MOCK_REFERRERS_COMPARISON = {
	date: '2026-05-30',
	period: 'day',
	days: {},
	summary: {
		groups: [
			{
				group: 'Search Engines',
				name: 'Search Engines',
				icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=32',
				total: 4160,
				results: [
					{
						name: 'Google Search',
						icon: 'https://www.google.com/s2/favicons?domain=google.com&sz=32',
						views: 3410,
						children: [
							{
								name: 'google.com',
								url: 'https://www.google.com/',
								views: 3280,
							},
							{
								name: 'google.co.uk',
								url: 'https://www.google.co.uk/',
								views: 130,
							},
						],
					},
					{
						name: 'Bing',
						icon: 'https://www.google.com/s2/favicons?domain=bing.com&sz=32',
						views: 480,
						children: [
							{
								name: 'bing.com',
								url: 'https://www.bing.com/',
								views: 480,
							},
						],
					},
					{
						name: 'DuckDuckGo',
						icon: 'https://www.google.com/s2/favicons?domain=duckduckgo.com&sz=32',
						views: 270,
						children: [
							{
								name: 'duckduckgo.com',
								url: 'https://duckduckgo.com/',
								views: 270,
							},
						],
					},
				],
			},
			{
				group: 'WordPress.com Reader',
				name: 'WordPress.com Reader',
				icon: 'https://www.google.com/s2/favicons?domain=wordpress.com&sz=32',
				total: 1390,
				results: [
					{
						name: 'WordPress.com Reader',
						url: 'https://wordpress.com/read',
						views: 1390,
					},
				],
			},
			{
				group: 'twitter.com',
				name: 'twitter.com',
				url: 'https://twitter.com/',
				icon: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=32',
				total: 1050,
				results: { views: 1050 },
			},
			{
				group: 'linkedin.com',
				name: 'linkedin.com',
				url: 'https://www.linkedin.com/',
				icon: 'https://www.google.com/s2/favicons?domain=linkedin.com&sz=32',
				total: 540,
				results: { views: 540 },
			},
		],
		other_views: 90,
		total_views: 7230,
	},
};

const MOCK_FILE_DOWNLOADS_FILES = [
	{
		relative_url: '/annual-report-2025.pdf',
		filename: 'annual-report-2025.pdf',
		download_url: 'https://example.com/annual-report-2025.pdf',
		downloads: '3840',
	},
	{
		relative_url: '/product-brochure.pdf',
		filename: 'product-brochure.pdf',
		download_url: 'https://example.com/product-brochure.pdf',
		downloads: '2610',
	},
	{
		relative_url: '/getting-started-guide.pdf',
		filename: 'getting-started-guide.pdf',
		download_url: 'https://example.com/getting-started-guide.pdf',
		downloads: '1920',
	},
	{
		relative_url: '/press-release-q1.docx',
		filename: 'press-release-q1.docx',
		download_url: 'https://example.com/press-release-q1.docx',
		downloads: '1305',
	},
	{
		relative_url: '/logo-assets.zip',
		filename: 'logo-assets.zip',
		download_url: 'https://example.com/logo-assets.zip',
		downloads: '870',
	},
];

const MOCK_FILE_DOWNLOADS_COMPARISON_FILES = [
	{
		relative_url: '/annual-report-2025.pdf',
		filename: 'annual-report-2025.pdf',
		download_url: 'https://example.com/annual-report-2025.pdf',
		downloads: '3200',
	},
	{
		relative_url: '/product-brochure.pdf',
		filename: 'product-brochure.pdf',
		download_url: 'https://example.com/product-brochure.pdf',
		downloads: '2900',
	},
	{
		relative_url: '/getting-started-guide.pdf',
		filename: 'getting-started-guide.pdf',
		download_url: 'https://example.com/getting-started-guide.pdf',
		downloads: '1600',
	},
	{
		relative_url: '/press-release-q1.docx',
		filename: 'press-release-q1.docx',
		download_url: 'https://example.com/press-release-q1.docx',
		downloads: '1500',
	},
	{
		relative_url: '/logo-assets.zip',
		filename: 'logo-assets.zip',
		download_url: 'https://example.com/logo-assets.zip',
		downloads: '700',
	},
];

const MOCK_FILE_DOWNLOADS = {
	date: '2026-06-29',
	period: 'day',
	days: {
		'2026-06-29': {
			files: MOCK_FILE_DOWNLOADS_FILES,
			other_downloads: 0,
			total_downloads: 10545,
		},
	},
	summary: {
		files: MOCK_FILE_DOWNLOADS_FILES,
		other_downloads: 0,
		total_downloads: 10545,
	},
};

const MOCK_FILE_DOWNLOADS_COMPARISON = {
	date: '2026-05-30',
	period: 'day',
	days: {
		'2026-05-30': {
			files: MOCK_FILE_DOWNLOADS_COMPARISON_FILES,
			other_downloads: 0,
			total_downloads: 9900,
		},
	},
	summary: {
		files: MOCK_FILE_DOWNLOADS_COMPARISON_FILES,
		other_downloads: 0,
		total_downloads: 9900,
	},
};

type UtmMock = {
	top_utm_values: Record< string, number >;
	top_posts: Record< string, unknown[] >;
};

function createUtmMock( topUtmValues: Record< string, number > ): UtmMock {
	return {
		top_utm_values: topUtmValues,
		top_posts: Object.fromEntries(
			Object.entries( topUtmValues ).map( ( [ key, value ], index ) => {
				const baseSlug = `utm-${ index + 1 }`;

				return [
					key,
					[
						{
							id: index * 2 + 1,
							title: `Landing page ${ index + 1 }`,
							views: Math.round( value * 0.6 ),
							href: `https://example.com/${ baseSlug }`,
						},
						{
							id: index * 2 + 2,
							title: `Signup page ${ index + 1 }`,
							views: Math.round( value * 0.3 ),
							href: `https://example.com/${ baseSlug }/signup`,
						},
					],
				];
			} )
		),
	};
}

// top_utm_values keys for multi-param endpoints are JSON-stringified arrays,
// matching the format the server returns and that sanitizeStatsUtmResponse parses.
const MOCK_UTM_SOURCE_MEDIUM = createUtmMock( {
	'["google","organic"]': 5200,
	'["twitter","social"]': 1800,
	'["newsletter","email"]': 950,
	'["facebook","paid"]': 720,
	'["bing","cpc"]': 380,
} );

const MOCK_UTM_SOURCE_MEDIUM_COMPARISON = createUtmMock( {
	'["google","organic"]': 4800,
	'["twitter","social"]': 2100,
	'["newsletter","email"]': 760,
	'["facebook","paid"]': 840,
	'["bing","cpc"]': 300,
} );

const MOCK_UTM_CAMPAIGN_SOURCE_MEDIUM = createUtmMock( {
	'["spring_sale","google","organic"]': 5200,
	'["newsletter_q2","newsletter","email"]': 1800,
	'["brand_awareness","twitter","social"]': 950,
	'["retargeting","facebook","paid"]': 720,
	'["product_launch","bing","cpc"]': 380,
} );

const MOCK_UTM_CAMPAIGN_SOURCE_MEDIUM_COMPARISON = createUtmMock( {
	'["spring_sale","google","organic"]': 4700,
	'["newsletter_q2","newsletter","email"]': 2100,
	'["brand_awareness","twitter","social"]': 780,
	'["retargeting","facebook","paid"]': 810,
	'["product_launch","bing","cpc"]': 330,
} );

const MOCK_UTM_SOURCE = createUtmMock( {
	google: 5200,
	twitter: 1800,
	newsletter: 950,
	facebook: 720,
	bing: 380,
} );

const MOCK_UTM_SOURCE_COMPARISON = createUtmMock( {
	google: 4800,
	twitter: 2100,
	newsletter: 760,
	facebook: 840,
	bing: 300,
} );

const MOCK_UTM_MEDIUM = createUtmMock( {
	organic: 5200,
	social: 1800,
	email: 950,
	paid: 720,
	cpc: 380,
} );

const MOCK_UTM_MEDIUM_COMPARISON = createUtmMock( {
	organic: 4800,
	social: 2100,
	email: 760,
	paid: 840,
	cpc: 300,
} );

const MOCK_UTM_CAMPAIGN = createUtmMock( {
	spring_sale: 5200,
	newsletter_q2: 1800,
	brand_awareness: 950,
	retargeting: 720,
	product_launch: 380,
} );

const MOCK_UTM_CAMPAIGN_COMPARISON = createUtmMock( {
	spring_sale: 4700,
	newsletter_q2: 2100,
	brand_awareness: 780,
	retargeting: 810,
	product_launch: 330,
} );

const UTM_MOCKS: Record< string, { primary: UtmMock; comparison: UtmMock } > = {
	'utm_source,utm_medium': {
		primary: MOCK_UTM_SOURCE_MEDIUM,
		comparison: MOCK_UTM_SOURCE_MEDIUM_COMPARISON,
	},
	'utm_campaign,utm_source,utm_medium': {
		primary: MOCK_UTM_CAMPAIGN_SOURCE_MEDIUM,
		comparison: MOCK_UTM_CAMPAIGN_SOURCE_MEDIUM_COMPARISON,
	},
	utm_source: { primary: MOCK_UTM_SOURCE, comparison: MOCK_UTM_SOURCE_COMPARISON },
	utm_medium: { primary: MOCK_UTM_MEDIUM, comparison: MOCK_UTM_MEDIUM_COMPARISON },
	utm_campaign: { primary: MOCK_UTM_CAMPAIGN, comparison: MOCK_UTM_CAMPAIGN_COMPARISON },
};

type GeoMode = 'country' | 'region' | 'city';

type StatsLocationItem = {
	location: string;
	views: number;
	country_code: string;
	coordinates?: {
		latitude: number;
		longitude: number;
	};
};

const COUNTRY_INFO = {
	US: { country_full: 'United States', map_region: '021' },
	GB: { country_full: 'United Kingdom', map_region: '154' },
	DE: { country_full: 'Germany', map_region: '155' },
	JP: { country_full: 'Japan', map_region: '030' },
	FR: { country_full: 'France', map_region: '155' },
	BR: { country_full: 'Brazil', map_region: '005' },
	IN: { country_full: 'India', map_region: '034' },
	AU: { country_full: 'Australia', map_region: '053' },
	CA: { country_full: 'Canada', map_region: '021' },
	MX: { country_full: 'Mexico', map_region: '013' },
	HK: { country_full: 'Hong Kong', map_region: '030' },
};

const COUNTRY_ROWS: StatsLocationItem[] = [
	{ location: 'United States', views: 8500, country_code: 'US' },
	{ location: 'United Kingdom', views: 4200, country_code: 'GB' },
	{ location: 'Germany', views: 3800, country_code: 'DE' },
	{ location: 'Japan', views: 3100, country_code: 'JP' },
	{ location: 'France', views: 2900, country_code: 'FR' },
	{ location: 'Brazil', views: 2400, country_code: 'BR' },
	{ location: 'India', views: 2200, country_code: 'IN' },
	{ location: 'Australia', views: 1800, country_code: 'AU' },
	{ location: 'Canada', views: 1650, country_code: 'CA' },
	{ location: 'Mexico', views: 1400, country_code: 'MX' },
];

const COUNTRY_COMPARISON_ROWS: StatsLocationItem[] = [
	{ location: 'United States', views: 7900, country_code: 'US' },
	{ location: 'United Kingdom', views: 4550, country_code: 'GB' },
	{ location: 'Germany', views: 3200, country_code: 'DE' },
	{ location: 'Japan', views: 2850, country_code: 'JP' },
	{ location: 'France', views: 3100, country_code: 'FR' },
	{ location: 'Brazil', views: 2100, country_code: 'BR' },
	{ location: 'India', views: 2500, country_code: 'IN' },
	{ location: 'Australia', views: 1700, country_code: 'AU' },
	{ location: 'Canada', views: 1800, country_code: 'CA' },
	{ location: 'Mexico', views: 1220, country_code: 'MX' },
];

const CITY_ROWS: StatsLocationItem[] = [
	{
		location: 'North Bergen',
		views: 2716,
		country_code: 'US',
		coordinates: { latitude: 40.8043, longitude: -74.0121 },
	},
	{
		location: 'Hong Kong',
		views: 1246,
		country_code: 'HK',
		coordinates: { latitude: 22.3193, longitude: 114.1694 },
	},
	{
		location: 'London',
		views: 476,
		country_code: 'GB',
		coordinates: { latitude: 51.5072, longitude: -0.1276 },
	},
	{
		location: 'Tokyo',
		views: 390,
		country_code: 'JP',
		coordinates: { latitude: 35.6762, longitude: 139.6503 },
	},
	{
		location: 'Berlin',
		views: 330,
		country_code: 'DE',
		coordinates: { latitude: 52.52, longitude: 13.405 },
	},
];

const CITY_COMPARISON_ROWS: StatsLocationItem[] = [
	{
		location: 'North Bergen',
		views: 2400,
		country_code: 'US',
		coordinates: { latitude: 40.8043, longitude: -74.0121 },
	},
	{
		location: 'Hong Kong',
		views: 1380,
		country_code: 'HK',
		coordinates: { latitude: 22.3193, longitude: 114.1694 },
	},
	{
		location: 'London',
		views: 520,
		country_code: 'GB',
		coordinates: { latitude: 51.5072, longitude: -0.1276 },
	},
	{
		location: 'Tokyo',
		views: 340,
		country_code: 'JP',
		coordinates: { latitude: 35.6762, longitude: 139.6503 },
	},
	{
		location: 'Berlin',
		views: 370,
		country_code: 'DE',
		coordinates: { latitude: 52.52, longitude: 13.405 },
	},
];

const REGION_ROWS_BY_COUNTRY: Record< string, StatsLocationItem[] > = {
	US: [
		{ location: 'California', views: 1800, country_code: 'US' },
		{ location: 'New York', views: 1280, country_code: 'US' },
		{ location: 'Texas', views: 1090, country_code: 'US' },
		{ location: 'Florida', views: 920, country_code: 'US' },
		{ location: 'Illinois', views: 640, country_code: 'US' },
	],
	GB: [
		{ location: 'England', views: 2100, country_code: 'GB' },
		{ location: 'Scotland', views: 760, country_code: 'GB' },
		{ location: 'Wales', views: 420, country_code: 'GB' },
		{ location: 'Northern Ireland', views: 280, country_code: 'GB' },
	],
	DE: [
		{ location: 'North Rhine-Westphalia', views: 980, country_code: 'DE' },
		{ location: 'Bavaria', views: 820, country_code: 'DE' },
		{ location: 'Berlin', views: 610, country_code: 'DE' },
		{ location: 'Hesse', views: 460, country_code: 'DE' },
	],
};

const REGION_COMPARISON_ROWS_BY_COUNTRY: Record< string, StatsLocationItem[] > = {
	US: [
		{ location: 'California', views: 1620, country_code: 'US' },
		{ location: 'New York', views: 1400, country_code: 'US' },
		{ location: 'Texas', views: 970, country_code: 'US' },
		{ location: 'Florida', views: 880, country_code: 'US' },
		{ location: 'Illinois', views: 720, country_code: 'US' },
	],
	GB: [
		{ location: 'England', views: 2200, country_code: 'GB' },
		{ location: 'Scotland', views: 690, country_code: 'GB' },
		{ location: 'Wales', views: 450, country_code: 'GB' },
		{ location: 'Northern Ireland', views: 240, country_code: 'GB' },
	],
	DE: [
		{ location: 'North Rhine-Westphalia', views: 900, country_code: 'DE' },
		{ location: 'Bavaria', views: 870, country_code: 'DE' },
		{ location: 'Berlin', views: 540, country_code: 'DE' },
		{ location: 'Hesse', views: 500, country_code: 'DE' },
	],
};

const MOCK_DEVICES_SCREENSIZE = {
	date: '2026-06-29',
	period: 'day',
	top_values: {
		desktop: 57.8,
		mobile: 37,
		tablet: 5.2,
	},
};

const MOCK_DEVICES_SCREENSIZE_COMPARISON = {
	date: '2026-05-30',
	period: 'day',
	top_values: {
		desktop: 52.3,
		mobile: 41.6,
		tablet: 6.1,
	},
};

const MOCK_DEVICES_BROWSER = {
	date: '2026-06-29',
	period: 'day',
	top_values: {
		chrome: 29451,
		safari: 3407,
		other: 2721,
		edge: 1823,
		firefox: 1444,
		opera: 169,
		samsung: 125,
		ie: 49,
		yandex: 36,
		miui: 14,
	},
};

const MOCK_DEVICES_BROWSER_COMPARISON = {
	date: '2026-05-30',
	period: 'day',
	top_values: {
		chrome: 27000,
		safari: 3800,
		other: 2500,
		edge: 1600,
		firefox: 1500,
		opera: 180,
		samsung: 118,
		ie: 60,
		yandex: 30,
		miui: 20,
	},
};

const MOCK_DEVICES_PLATFORM = {
	date: '2026-06-29',
	period: 'day',
	top_values: {
		windows: 22589,
		mac: 5981,
		android: 3140,
		linux: 2720,
		other: 2376,
		iphone: 2095,
		chrome: 149,
		ipad: 128,
		android_tablet: 74,
	},
};

const MOCK_DEVICES_PLATFORM_COMPARISON = {
	date: '2026-05-30',
	period: 'day',
	top_values: {
		windows: 21000,
		mac: 6300,
		android: 2800,
		linux: 2500,
		other: 2300,
		iphone: 2400,
		chrome: 130,
		ipad: 140,
		android_tablet: 66,
	},
};

// Heuristic: a request whose `date` param is more than 1 day ago is treated as the
// comparison-period request. This works for the default `last-30-days` preset (primary
// date ~= today, comparison date ~= 30 days ago). It would misclassify a `today` preset
// (comparison date = yesterday, daysFromToday === 1), but the stories only use the default
// preset so this is fine in practice.
function isComparisonRequest( path: string ): boolean {
	const queryString = path.split( '?' )[ 1 ];
	const requestDate = queryString ? new URLSearchParams( queryString ).get( 'date' ) : null;

	if ( ! requestDate ) {
		return false;
	}

	const today = new Date().toISOString().slice( 0, 10 );
	const daysFromToday = Math.floor(
		( Date.parse( today ) - Date.parse( requestDate ) ) / DAY_IN_MS
	);

	return daysFromToday > 1;
}

function getRequestDate( query: URLSearchParams ) {
	return query.get( 'date' ) || new Date().toISOString().slice( 0, 10 );
}

function getLocationRows(
	geoMode: GeoMode,
	query: URLSearchParams,
	isComparison: boolean
): StatsLocationItem[] {
	if ( geoMode === 'city' ) {
		return isComparison ? CITY_COMPARISON_ROWS : CITY_ROWS;
	}

	if ( geoMode === 'region' ) {
		const countryCode = query.get( 'filter_by_country' ) || 'US';
		const regionRows = isComparison ? REGION_COMPARISON_ROWS_BY_COUNTRY : REGION_ROWS_BY_COUNTRY;

		return regionRows[ countryCode ] ?? regionRows.US;
	}

	return isComparison ? COUNTRY_COMPARISON_ROWS : COUNTRY_ROWS;
}

function buildStatsLocationViewsResponse(
	geoMode: GeoMode,
	query: URLSearchParams,
	isComparison: boolean
) {
	const rows = getLocationRows( geoMode, query, isComparison );
	const date = getRequestDate( query );
	const totalViews = rows.reduce( ( sum, item ) => sum + item.views, 0 );

	return {
		date,
		period: query.get( 'period' ) || 'day',
		'country-info': COUNTRY_INFO,
		summary: {
			views: rows,
			other_views: 0,
			total_views: totalViews,
		},
		days: {
			[ date ]: {
				views: rows,
				other_views: 0,
				total_views: totalViews,
			},
		},
	};
}

function getStatsMock( path: string ): unknown | null {
	const withoutBase = path.slice( STATS_BASE.length );
	const queryIndex = withoutBase.indexOf( '?' );
	const subPath = queryIndex === -1 ? withoutBase : withoutBase.slice( 0, queryIndex );
	const query = new URLSearchParams( queryIndex === -1 ? '' : withoutBase.slice( queryIndex + 1 ) );
	const isComparison = isComparisonRequest( path );

	if ( subPath.startsWith( '/clicks' ) ) {
		return isComparison ? MOCK_CLICKS_COMPARISON : MOCK_CLICKS;
	}

	if ( subPath.startsWith( '/referrers' ) ) {
		return isComparison ? MOCK_REFERRERS_COMPARISON : MOCK_REFERRERS;
	}

	if ( subPath.startsWith( '/file-downloads' ) ) {
		return isComparison ? MOCK_FILE_DOWNLOADS_COMPARISON : MOCK_FILE_DOWNLOADS;
	}

	const locationViewsMatch = subPath.match( /^\/location-views\/(country|region|city)$/ );
	if ( locationViewsMatch ) {
		return buildStatsLocationViewsResponse(
			locationViewsMatch[ 1 ] as GeoMode,
			query,
			isComparison
		);
	}

	// /stats/utm/{utmParam} — strip leading slash and match against known params.
	if ( subPath.startsWith( '/utm/' ) ) {
		const utmParam = subPath.slice( '/utm/'.length );
		const mock = UTM_MOCKS[ utmParam ];

		if ( mock ) {
			return isComparison ? mock.comparison : mock.primary;
		}

		return { top_utm_values: {}, top_posts: {} };
	}

	if ( subPath.startsWith( '/devices/screensize' ) ) {
		return isComparison ? MOCK_DEVICES_SCREENSIZE_COMPARISON : MOCK_DEVICES_SCREENSIZE;
	}
	if ( subPath.startsWith( '/devices/browser' ) ) {
		return isComparison ? MOCK_DEVICES_BROWSER_COMPARISON : MOCK_DEVICES_BROWSER;
	}
	if ( subPath.startsWith( '/devices/client_type' ) || subPath.startsWith( '/devices/platform' ) ) {
		return isComparison ? MOCK_DEVICES_PLATFORM_COMPARISON : MOCK_DEVICES_PLATFORM;
	}

	return null;
}

function prepareStatsMockResponse( mock: unknown, parse?: boolean ) {
	if ( parse === false ) {
		return new Response( JSON.stringify( mock ), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		} );
	}

	return mock;
}

const statsMocksMiddleware: APIFetchMiddleware = async ( options: APIFetchOptions, next ) => {
	const requestPath = options.path ?? options.url ?? '';

	if ( ! requestPath.startsWith( STATS_BASE ) ) {
		return next( options );
	}

	const mock = getStatsMock( requestPath );

	if ( mock !== null ) {
		return prepareStatsMockResponse( mock, options.parse );
	}

	// Stats endpoints this middleware doesn't know may be owned by the shared
	// report mocks (register-report-mocks.ts), including its forced-state
	// overrides. Fall through instead of answering with an empty catch-all:
	// story-module load order decides which mock middleware runs first, so
	// swallowing unknown endpoints here starves the other middleware whenever
	// this one registers later.
	return next( options );
};

let registered = false;

/**
 * Registers the Stats API mock middleware. Idempotent.
 */
export function registerStatsMocks(): void {
	if ( registered ) {
		return;
	}
	registered = true;
	apiFetch.use( statsMocksMiddleware );
}
