import { __ } from '@wordpress/i18n';

export default {
	prepTime: {
		type: 'string',
		default: '15m',
	},
	prepTimeUnit: {
		type: 'string',
		default: 'm',
	},
	prepTimeLabel: {
		type: 'string',
		// translators: Prep Time label for a recipe block.
		default: __( 'Prep Time', 'jetpack' ),
	},
	cookTime: {
		type: 'string',
		default: '30m',
	},
	cookTimeUnit: {
		type: 'string',
		default: 'm',
	},
	cookTimeLabel: {
		type: 'string',
		// translators: Cook Time label for a recipe block.
		default: __( 'Cook Time', 'jetpack' ),
	},
	servings: {
		type: 'number',
		default: 4,
	},
	servingsLabel: {
		type: 'string',
		// translators: Servings label for a recipe block.
		default: __( 'Servings', 'jetpack' ),
	},
};
