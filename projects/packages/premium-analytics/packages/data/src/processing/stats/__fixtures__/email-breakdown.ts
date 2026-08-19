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

// `Other` outranks `Gmail` by value so the fixture proves the catch-all bucket is
// pinned last rather than merely landing last by value.
export const emailFieldlessClientsFixture = {
	clients: {
		data: [
			[ 'Other', '9' ],
			[ 'Apple Mail', '10' ],
			[ 'Gmail', '8' ],
		],
	},
};

// Matrix (fields-based) counterpart of the clients breakdown. `Other` outranks
// every named client by value, so the fixture proves the matrix path pins the
// catch-all bucket last rather than returning rows in raw API order.
export const emailMatrixClientsFixture = {
	clients: {
		fields: [ 'client', 'opens_count' ],
		data: [
			[ 'Other', '265' ],
			[ 'Apple Mail', '200' ],
			[ 'Thunderbird', '180' ],
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
