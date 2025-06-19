import transforms from './transforms';

export default {
	apiVersion: 3,
	attributes: {
		id: { type: 'string' },
		required: {
			type: 'boolean',
			default: false,
		},
		width: {
			type: 'number',
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
