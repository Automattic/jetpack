/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

const name = 'premium-content/buttons';
const settings = {
	title: __( 'Premium Content buttons', 'jetpack' ),
	description: __(
		'Prompt Premium Content visitors to take action with a group of button-style links.',
		'jetpack'
	),
	category: 'grow',
	icon,
	parent: [ 'premium-content/container' ],
	supports: {
		inserter: false,
		align: true,
		alignWide: false,
		lightBlockWrapper: true,
	},
	attributes: {
		isPremiumContentChild: {
			type: 'bool',
			default: true,
		},
	},
	providesContext: {
		isPremiumContentChild: 'isPremiumContentChild',
	},
	keywords: [ __( 'link', 'jetpack' ) ],
	edit,
	save,
	usesContext: [ 'premium-content/planId', 'premium-content/isPreview' ],
};

export { name, settings };
