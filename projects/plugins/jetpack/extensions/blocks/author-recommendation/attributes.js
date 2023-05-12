export default {
	recommendations: {
		type: 'array',
		items: {
			type: 'object',
		},
		default: [],
	},
	remove_user_blogs: {
		type: 'boolean',
		default: false,
	},
};
