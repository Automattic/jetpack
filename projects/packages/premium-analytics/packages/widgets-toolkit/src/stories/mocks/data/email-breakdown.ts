/**
 * Raw WPCOM email breakdown responses for the "Email breakdown" widget stories.
 *
 * These mirror the fieldless all-time shapes the
 * `sanitizeStatsEmailBreakdownResponse` parser reads for
 * `stats/opens/emails/{id}/{breakdown}` and `stats/clicks/emails/{id}/{breakdown}`:
 * `countries` + `countries-info`, `devices`, `clients`, `links`, and
 * `user-content-links`. Each per-breakdown endpoint returns only its own payload
 * key (Calypso fetches `link` and `user-content-link` separately and merges), so
 * the link fixtures are split per endpoint. One populated fixture per breakdown
 * so reviewers can validate each. The endpoints have no comparison period.
 */

export const mockEmailCountryBreakdown = {
	countries: {
		data: [
			[ 'US', 1840 ],
			[ 'GB', 720 ],
			[ 'CA', 510 ],
			[ 'DE', 430 ],
			[ 'FR', 380 ],
			[ 'IN', 295 ],
			[ 'BR', 210 ],
			[ 'AU', 165 ],
		],
	},
	'countries-info': {
		US: { country_full: 'United States', map_region: '021' },
		GB: { country_full: 'United Kingdom', map_region: '154' },
		CA: { country_full: 'Canada', map_region: '021' },
		DE: { country_full: 'Germany', map_region: '155' },
		FR: { country_full: 'France', map_region: '155' },
		IN: { country_full: 'India', map_region: '034' },
		BR: { country_full: 'Brazil', map_region: '005' },
		AU: { country_full: 'Australia', map_region: '053' },
	},
};

export const mockEmailDeviceBreakdown = {
	devices: {
		data: [
			[ 'Desktop', 3120 ],
			[ 'Mobile', 2480 ],
			[ 'Tablet', 610 ],
			[ 'Other', 95 ],
		],
	},
};

export const mockEmailClientBreakdown = {
	clients: {
		data: [
			[ 'Apple Mail', 2410 ],
			[ 'Gmail', 1890 ],
			[ 'Outlook', 940 ],
			[ 'Yahoo Mail', 520 ],
			[ 'Thunderbird', 180 ],
			[ 'Other', 265 ],
		],
	},
};

export const mockEmailInternalLinkBreakdown = {
	links: {
		data: [
			[ 'post-url', 640 ],
			[ 'like-post', 210 ],
			[ 'comment-post', 130 ],
			[ 'remove-subscription', 48 ],
			[ 'some-other-internal', 22 ],
		],
	},
};

export const mockEmailUserContentLinkBreakdown = {
	'user-content-links': {
		data: [
			[ 'https://example.com/2026/spring-sale', 512 ],
			[ 'https://example.com/blog/whats-new', 388 ],
			[ 'https://example.com/pricing', 205 ],
			[ 'https://example.com/docs/getting-started', 154 ],
			[ 'https://example.com/contact', 76 ],
		],
	},
};
