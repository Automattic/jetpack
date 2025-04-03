import attributes from './attributes';
import transforms from './transforms';

export default {
	apiVersion: 3,
	attributes,
	category: 'contact-form',
	example: {},
	providesContext: { 'jetpack/field-required': 'required' },
	save: () => null,
	supports: {
		reusable: false,
		html: false,
		__experimentalExposeControlsToChildren: true,
	},
	transforms,
};
