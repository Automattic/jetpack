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
		// FORMS-694 (interim): the per-viewport "Hide on…" option isn't honored
		// in the forms render pipeline — fields flatten to a shortcode and bypass
		// core's render_block class injection — and on a required field it can't
		// be made safe (server/client validation are viewport-blind). "Hide
		// everywhere" does work, but the control bundles both under one boolean,
		// so we disable it wholesale here. Labels keep it (full-hide wired via
		// labelhiddenbyblockvisibility). Full field visibility is a separate call.
		visibility: false,
		__experimentalExposeControlsToChildren: true,
	},
	transforms,
};
