export default {
	content: {
		type: 'string',
		source: 'html',
	},
	animationDone: {
		type: 'boolean',
		default: false,
	},
	needsMoreCharacters: {
		type: 'boolean',
		default: false,
	},
	showRetry: {
		type: 'boolean',
		default: false,
	},
	errorMessage: {
		type: 'string',
		default: '',
	},
};
