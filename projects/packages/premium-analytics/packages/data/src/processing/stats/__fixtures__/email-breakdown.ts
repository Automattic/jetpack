export const emailCountriesFixture = {
	countries: {
		fields: [ 'country_code', 'opens_count' ],
		data: [ [ 'NZ', '12' ] ],
	},
	'countries-info': {
		NZ: {
			country_full: 'New Zealand',
		},
	},
};

export const emailFieldlessCountriesFixture = {
	countries: {
		data: [
			[ 'US', '18' ],
			[ 'NZ', '12' ],
			[ 'XX', '2' ],
		],
	},
	'countries-info': {
		NZ: {
			country_full: 'New Zealand',
			map_region: '009',
		},
		US: {
			country_full: 'United States',
			map_region: '019',
		},
	},
};

export const emailFieldlessClientsFixture = {
	clients: {
		data: [
			[ 'Other', '1' ],
			[ 'Apple Mail', '10' ],
			[ 'Gmail', '8' ],
		],
	},
};

export const emailFieldlessLinksFixture = {
	links: {
		data: [
			[ 'post-url', '7' ],
			[ 'custom-action', '3' ],
			[ 'user_link', '2' ],
			[ 'like-post', '1' ],
		],
	},
	'user-content-links': {
		data: [
			[ 'https://example.com/a', '4' ],
			[ 'https://example.com/b', '2' ],
		],
	},
};
