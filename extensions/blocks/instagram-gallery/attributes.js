export default {
	accessToken: {
		type: 'string',
	},
	instagramUser: {
		type: 'string',
	},
	columns: {
		type: 'number',
		default: 3,
		min: 1,
		max: 6,
	},
	count: {
		type: 'number',
		default: 9,
		min: 1,
		max: 30,
	},
	spacing: {
		type: 'number',
		default: 10,
		min: 0,
		max: 50,
	},
	isStackedOnMobile: {
		type: 'boolean',
		default: true,
	},
};
