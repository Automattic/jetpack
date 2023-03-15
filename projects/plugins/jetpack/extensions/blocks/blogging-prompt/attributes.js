export default {
	answersLink: {
		type: 'string',
		source: 'attribute',
		attribute: 'href',
		selector: '.jetpack-blogging-prompt__answers-link',
	},
	answersLinkText: {
		type: 'string',
		source: 'html',
		selector: '.jetpack-blogging-prompt__answers-link',
	},
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
	promptLabel: {
		type: 'string',
		source: 'html',
		selector: '.jetpack-blogging-prompt__label',
	},
	promptText: {
		type: 'string',
		source: 'html',
		selector: '.jetpack-blogging-prompt__text',
	},
	promptFetched: {
		type: 'boolean',
		default: false,
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
