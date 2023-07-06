export default {
	content: {
		type: 'string',
	},

	originalContent: {
		type: 'string',
	},

	promptType: {
		type: 'string',
	},

	originalMessages: {
		type: 'array',
		default: [],
	},

	messages: {
		type: 'array',
		default: [],
	},

	isLayoutBuldingModeEnable: {
		type: 'boolean',
		default: false,
	},
};
