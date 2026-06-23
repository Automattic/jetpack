export const locationsFixture = {
	date: '2026-06-22',
	days: {
		'2026-06-16': {
			views: [
				{
					country_code: 'CI',
					views: '7',
				},
				{
					country_code: 'A1',
					views: '3',
				},
			],
			other_views: 4,
			total_views: 14,
		},
	},
	'country-info': {
		CI: {
			country_full: 'Côte d’Ivoire’s',
			map_region: '002',
		},
	},
};

export const locationsSummaryFixture = {
	date: '2026-06-22',
	period: 'day',
	'country-info': {
		US: {
			country_full: 'United States',
			map_region: '021',
		},
		HK: {
			country_full: 'Hong Kong SAR China',
			map_region: '030',
		},
		HU: {
			country_full: 'Hungary',
			map_region: '151',
		},
		CI: {
			country_full: 'Côte d’Ivoire',
			map_region: '002',
		},
	},
	summary: {
		views: [
			{
				location: 'New Jersey',
				views: 2979,
				country_code: 'US',
			},
			{
				location: 'Hong Kong',
				views: 1252,
				country_code: 'HK',
			},
			{
				location: 'Hungary',
				views: 59,
				country_code: 'HU',
			},
			{
				location: 'Côte d’Ivoire',
				views: 2,
				country_code: 'CI',
			},
		],
		other_views: 0,
		total_views: 0,
	},
};

export const locationsCitySummaryFixture = {
	date: '2026-06-22',
	period: 'day',
	'country-info': {
		US: {
			country_full: 'United States',
			map_region: '021',
		},
		HK: {
			country_full: 'Hong Kong SAR China',
			map_region: '030',
		},
		GB: {
			country_full: 'United Kingdom',
			map_region: '154',
		},
	},
	summary: {
		views: [
			{
				location: 'North Bergen',
				views: 2716,
				country_code: 'US',
				coordinates: {
					latitude: '40.804077',
					longitude: '-74.012366',
				},
			},
			{
				location: 'Hong Kong',
				views: 1246,
				country_code: 'HK',
				coordinates: {
					latitude: '22.28552',
					longitude: '114.15769',
				},
			},
			{
				location: 'London',
				views: 476,
				country_code: 'GB',
				coordinates: {
					latitude: '51.50853',
					longitude: '-0.12574',
				},
			},
		],
		other_views: 0,
		total_views: 0,
	},
};
