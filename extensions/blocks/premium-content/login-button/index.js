/**
 * WordPress dependencies
 */
import { button as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

const name = 'premium-content/login-button';

/**
 * @typedef {object} Attributes
 * @property { string } text
 * @property { number } borderRadius
 * @property { string } backgroundColor
 * @property { string } textColor
 * @property { string } gradient
 * @property { object } style
 *
 * @typedef {import('@wordpress/blocks').BlockConfiguration<Attributes>} BlockConfiguration
 * @type {BlockConfiguration}
 */
const settings = {
	title: __( 'Premium Content login button', 'jetpack' ),
	description: __(
		'Prompt subscriber visitors to log in with a button-style link (only visible for logged out users).',
		'jetpack'
	),
	category: 'grow',
	attributes: {
		text: {
			type: 'string',
			source: 'html',
			selector: 'a',
			default: __( 'Log in', 'jetpack' ),
		},
		borderRadius: {
			type: 'number',
		},
		backgroundColor: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		gradient: {
			type: 'string',
		},
		style: {
			type: 'object',
		},
	},
	icon,
	keywords: [ __( 'link', 'jetpack' ) ],
	supports: {
		align: true,
		alignWide: false,
		html: false,
		lightBlockWrapper: true,
	},
	styles: [
		{ name: 'fill', label: __( 'Fill', 'jetpack' ), isDefault: true },
		{ name: 'outline', label: __( 'Outline', 'jetpack' ) },
	],
	edit,
	save,
};

export { name, settings };
