export default {
	ingredients: {
		type: 'array',
		default: [],
	},
	steps: {
		type: 'array',
		default: [],
	},
	prepTime: {
		type: 'string',
		default: '15m',
	},
	prepTimeUnit: {
		type: 'string',
		default: 'm',
	},
	cookTime: {
		type: 'string',
		default: '30m',
	},
	cookTimeUnit: {
		type: 'string',
		default: 'm',
	},
	servings: {
		type: 'number',
		default: 4,
	},
};
