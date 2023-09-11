import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';
import attributes from './attributes';
import deprecatedV1 from './deprecated/v1';
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
	attributes,
	icon,
	keywords: [ __( 'link', 'jetpack' ) ],
	supports: {
		align: true,
		alignWide: false,
		html: false,
		lightBlockWrapper: true,
		inserter: false,
	},
	styles: [
		{ name: 'fill', label: __( 'Fill', 'jetpack' ), isDefault: true },
		{ name: 'outline', label: __( 'Outline', 'jetpack' ) },
	],
	edit,
	save,
	deprecated: [ deprecatedV1 ],
};

export { name, settings };
