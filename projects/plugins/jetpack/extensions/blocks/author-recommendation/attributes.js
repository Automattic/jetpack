export default {
	recommendations: {
		type: 'array',
		items: {
			type: 'object',
		},
		default: [],
	},
	ignore_user_blogs: {
		type: 'boolean',
		default: false,
	},
};
