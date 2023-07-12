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

	useGutenbergSyntax: {
		type: 'boolean',
		default: false,
	},

	useGpt4: {
		type: 'boolean',
		default: false,
	},

	customSystemPrompt: {
		type: 'string',
		default: '',
	},
};
