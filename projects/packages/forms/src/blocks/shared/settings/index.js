import transforms from './transforms.js';

export default {
	apiVersion: 3,
	attributes: {
		id: { type: 'string' },
		required: {
			type: 'boolean',
			default: false,
		},
		requiredIndicator: {
			type: 'boolean',
			default: true,
		},
		width: {
			enum: [ 25, 33, 50, 75, 100, 'auto' ],
			default: 100,
		},
		shareFieldAttributes: {
			type: 'boolean',
			default: true,
		},
	},
	category: 'contact-form',
	providesContext: {
		'jetpack/field-required': 'required',
		'jetpack/field-share-attributes': 'shareFieldAttributes',
	},
	save: () => null,
	supports: {
		reusable: false,
		html: false,
		__experimentalExposeControlsToChildren: true,
	},
	transforms,
};
