export default {
	gravatars: {
		type: 'array',
		source: 'query',
		selector: '.jetpack-blogging-prompt__answers-gravatar',
		query: {
			url: {
				type: 'string',
				source: 'attribute',
				attribute: 'src',
			},
		},
	},
	prompt: {
		type: 'text',
		source: 'html',
		selector: '.jetpack-blogging-prompt__prompt',
	},
	promptId: {
		type: 'number',
	},
	showResponses: {
		type: 'boolean',
		default: true,
	},
	showLabel: {
		type: 'boolean',
		default: true,
	},
	tagsAdded: {
		type: 'boolean',
		default: false,
	},
};
