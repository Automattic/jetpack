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
		conditionalLogic: {
			type: 'object',
			default: {
				enabled: false,
				action: 'show',
				// Combines the groups with each other; each group combines its own rules.
				logicalOperator: 'any',
				// An array, not a map: a map cannot express "any of these AND all of those",
				// which is where this is heading. The V1 panel writes one group, so showing a
				// second one later is a panel change rather than a storage change. Rules carry
				// their own type, so further condition kinds slot into a group instead.
				groups: [],
			},
		},
		helpText: {
			type: 'string',
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
