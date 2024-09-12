export default {
	postLayout: {
		type: 'string',
		default: 'grid',
	},
	displayAuthor: {
		type: 'boolean',
		default: false,
	},
	displayDate: {
		type: 'boolean',
		default: true,
	},
	displayHeadline: {
		type: 'boolean',
		default: false,
	},
	displayThumbnails: {
		type: 'boolean',
		default: false,
	},
	displayContext: {
		type: 'boolean',
		default: false,
	},
	headline: {
		type: 'string',
		default: '',
	},
	postsToShow: {
		type: 'number',
		default: 3,
	},
};
