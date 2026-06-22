export const visitsFixture = {
	fields: [ 'period', 'views', 'visitors', 'likes', 'comments' ],
	data: [
		[ '2026-06-15', '8', '3', 1, 0 ],
		[ '2026-06-16', '13', '5', 2, 1 ],
	],
};

export const weeklySubscribersFixture = {
	timeline: {
		unit: 'week',
		fields: [ 'period', 'subscribers' ],
		data: [ [ '2026-W25', '9' ] ],
	},
};

export const invalidWeekSubscribersFixture = {
	timeline: {
		unit: 'week',
		fields: [ 'period', 'subscribers' ],
		data: [ [ '2026-W54', '9' ] ],
	},
};

export const invalidIsoWeekYearSubscribersFixture = {
	timeline: {
		unit: 'week',
		fields: [ 'period', 'subscribers' ],
		data: [ [ '2025-W53', '9' ] ],
	},
};

export const monthlySubscribersFixture = {
	timeline: {
		unit: 'month',
		fields: [ 'period', 'subscribers' ],
		data: [ [ '2024-02', '29' ] ],
	},
};

export const yearlySubscribersFixture = {
	timeline: {
		unit: 'year',
		fields: [ 'period', 'subscribers' ],
		data: [ [ '2024', '366' ] ],
	},
};

export const scalarDaysTimeSeriesFixture = {
	days: {
		'2026-06-15': '7',
		'2026-06-16': 3,
	},
};
