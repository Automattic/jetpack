export const visitsFixture = {
	fields: [ 'period', 'views', 'visitors', 'likes', 'comments' ],
	data: [
		[ '2026-06-15', '8', '3', 1, 0 ],
		[ '2026-06-16', '13', '5', 2, 1 ],
	],
};

export const objectRowsTimeSeriesFixture = {
	unit: 'day',
	data: [
		{
			period: '2026-06-15',
			subscribers: '7',
			unsubscribers: '2',
		},
	],
};

export const weeklySubscribersFixture = {
	unit: 'week',
	fields: [ 'period', 'subscribers' ],
	data: [ [ '2026-W25', '9' ] ],
};

export const wpcomWeeklySubscribersFixture = {
	unit: 'week',
	fields: [ 'period', 'subscribers' ],
	data: [ [ '2026W06W29', '9' ] ],
};

export const invalidWeekSubscribersFixture = {
	unit: 'week',
	fields: [ 'period', 'subscribers' ],
	data: [ [ '2026-W54', '9' ] ],
};

export const invalidIsoWeekYearSubscribersFixture = {
	unit: 'week',
	fields: [ 'period', 'subscribers' ],
	data: [ [ '2025-W53', '9' ] ],
};

export const monthlySubscribersFixture = {
	unit: 'month',
	fields: [ 'period', 'subscribers' ],
	data: [ [ '2024-02', '29' ] ],
};

export const yearlySubscribersFixture = {
	unit: 'year',
	fields: [ 'period', 'subscribers' ],
	data: [ [ '2024', '366' ] ],
};

export const scalarDaysTimeSeriesFixture = {
	days: {
		'2026-06-15': '7',
		'2026-06-16': 3,
	},
};

export const emailOpensTimeSeriesFixture = {
	timeline: {
		unit: 'day',
		fields: [ 'date', 'opens_count' ],
		data: [
			[ '2026-06-15', 8 ],
			[ '2026-06-16', 13 ],
		],
	},
};

export const emailClicksTimeSeriesFixture = {
	timeline: {
		unit: 'day',
		fields: [ 'date', 'clicks_count' ],
		data: [
			[ '2026-06-15', '4' ],
			[ '2026-06-16', '7' ],
		],
	},
};

export const emailOpensHourlyTimeSeriesFixture = {
	timeline: {
		unit: 'hour',
		fields: [ 'date', 'hour', 'opens_count' ],
		data: [
			[ '2026-06-15', 9, 3 ],
			[ '2026-06-15', 10, 5 ],
		],
	},
};

export const emailClicksHourlyTimeSeriesFixture = {
	timeline: {
		unit: 'hour',
		fields: [ 'date', 'hour', 'clicks_count' ],
		data: [
			[ '2026-06-15', 9, 4 ],
			[ '2026-06-15', 10, 7 ],
		],
	},
};
