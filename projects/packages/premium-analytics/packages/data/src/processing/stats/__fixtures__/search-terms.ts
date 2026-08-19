export const searchTermsFixture = {
	date: '2026-06-22',
	period: 'day',
	days: {
		'2026-06-16': {
			search_terms: [ { term: 'delete revisions for wordpress', views: 1 } ],
			encrypted_search_terms: 4,
			other_search_terms: 0,
			total_search_terms: 5,
		},
	},
};

export const searchTermsSummaryFixture = {
	date: '2026-06-22',
	period: 'day',
	summary: {
		search_terms: [
			{ term: 'delete revisions for wordpress', views: 1 },
			{ term: 'ending quote for how to make monday appealing', views: 1 },
			{ term: 'how do i turn off "your connection to this site is not secure"?', views: 1 },
		],
		total_search_terms: 0,
		encrypted_search_terms: 31,
		other_search_terms: -34,
	},
};
