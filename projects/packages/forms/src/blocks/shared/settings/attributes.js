// TODO: Remove all the old deprecated attributes e.g. label, options, and style attributes.
// TODO: Fix all the defaults that shouldn't have empty strings.
export default {
	label: {
		type: 'string',
		default: null,
		role: 'content',
	},
	required: {
		type: 'boolean',
		default: false,
	},
	requiredText: {
		type: 'string',
		role: 'content',
	},
	options: {
		type: 'array',
		default: [],
		role: 'content',
	},
	defaultValue: {
		type: 'string',
		default: '',
		role: 'content',
	},
	placeholder: {
		type: 'string',
		default: '',
		role: 'content',
	},
	id: {
		type: 'string',
		default: '',
	},
	width: {
		type: 'number',
		default: 100,
	},
	borderRadius: {
		type: 'number',
		default: '',
	},
	borderWidth: {
		type: 'number',
		default: '',
	},
	labelFontSize: {
		type: 'string',
	},
	fieldFontSize: {
		type: 'string',
	},
	lineHeight: {
		type: 'number',
	},
	labelLineHeight: {
		type: 'number',
	},
	inputColor: {
		type: 'string',
	},
	labelColor: {
		type: 'string',
	},
	fieldBackgroundColor: {
		type: 'string',
	},
	buttonBackgroundColor: {
		type: 'string',
	},
	buttonBorderRadius: {
		type: 'number',
		default: '',
	},
	buttonBorderWidth: {
		type: 'number',
		default: '',
	},
	borderColor: {
		type: 'string',
	},
	shareFieldAttributes: {
		type: 'boolean',
		default: true,
	},
};
