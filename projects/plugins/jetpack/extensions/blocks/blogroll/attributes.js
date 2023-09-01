export default {
	recommendations: {
		type: 'array',
		items: {
			type: 'object',
		},
		default: [],
	},
	show_avatar: {
		type: 'boolean',
		default: true,
	},
	show_description: {
		type: 'boolean',
		default: true,
	},
	show_subscribe_button: {
		type: 'boolean',
		default: true,
	},
	open_links_new_window: {
		type: 'boolean',
		default: true,
	},
	ignore_user_blogs: {
		type: 'boolean',
		default: true,
	},
};
