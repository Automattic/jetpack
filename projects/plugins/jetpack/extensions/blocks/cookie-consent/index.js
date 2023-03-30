import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import edit from './edit';
import icon from './icon';
import save from './save';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'cookie-consent';
export const title = __( 'Cookie Consent', 'jetpack' );
export const cookieName = 'eucookielaw';
export const settings = {
	title,
	description: __(
		'Displays a customizable cookie consent banner. To display this block on all pages of your site, please add it inside a Template Part that is present on all your templates, like a Header or a Footer.',
		'jetpack'
	),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'grow',
	keywords: [
		'cookie',
		'consent',
		'privacy',
		'GDPR',
		'EU',
		__( 'cookies', 'jetpack' ),
		__( 'privacy', 'jetpack' ),
		__( 'EU', 'jetpack' ),
	],
	supports: {
		align: [ 'left', 'right', 'wide', 'full' ],
		alignWide: true,
		anchor: false,
		color: {
			gradients: true,
			link: true,
		},
		spacing: {
			padding: true,
		},
		customClassName: true,
		className: true,
		html: false,
		lock: false,
		multiple: false,
		reusable: false,
	},
	edit,
	save,
	attributes,
	example: {
		attributes: {},
	},
};
