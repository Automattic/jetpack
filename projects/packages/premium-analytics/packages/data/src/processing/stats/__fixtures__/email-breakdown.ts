// All-time breakdown payloads as WPCOM returns them: one payload key per endpoint, rows as
// `[ label, count ]`, and `fields` naming those columns.

export const emailCountriesFixture = {
	countries: {
		data: [
			[ 'US', 18 ],
			[ 'NZ', 12 ],
			[ 'XX', 2 ],
		],
		fields: [ 'country', 'opens_count' ],
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

// `Other` outranks every named client by value, so the fixture proves the catch-all
// bucket is pinned last rather than merely landing last by value.
export const emailClientsFixture = {
	clients: {
		data: [
			[ 'Other', 265 ],
			[ 'Apple Mail', 200 ],
			[ 'Thunderbird', 180 ],
		],
		fields: [ 'client', 'opens_count' ],
	},
};

export const emailLinksFixture = {
	links: {
		data: [
			[ 'post-url', 7 ],
			[ 'custom-action', 3 ],
			[ 'user_link', 2 ],
			[ 'like-post', 1 ],
		],
		fields: [ 'link_desc', 'clicks_count' ],
	},
};

export const emailUserContentLinksFixture = {
	'user-content-links': {
		data: [
			[ 'https://example.com/a', 4 ],
			[ 'https://example.com/b', 2 ],
		],
		fields: [ 'url', 'clicks_count' ],
	},
};
