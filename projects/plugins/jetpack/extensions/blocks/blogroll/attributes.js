export default {
	id: {
		type: 'number',
	},
	name: {
		type: 'string',
	},
	icon: {
		type: 'string',
		default: 'https://s0.wp.com/i/webclip.png',
	},
	url: {
		type: 'string',
	},
	description: {
		type: 'string',
	},
	load_placeholders: {
		type: 'boolean',
		default: true,
	},
	ignore_user_blogs: {
		type: 'boolean',
		default: true,
	},
};
