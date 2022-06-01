import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import attributes from './attributes';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import icon from './icon';
import save from './save';
import './editor.scss';

export const name = 'whatsapp-button';
export const title = __( 'WhatsApp Button', 'jetpack' );
export const whatsAppURL = 'https://api.whatsapp.com/send?phone=';
export const defaultButtonText = __( 'Chat on WhatsApp', 'jetpack' );
export const defaultFirstMessage = __(
	'Hi, I got your WhatsApp information from your website.',
	'jetpack'
);

export const settings = {
	title,
	description: __(
		'Let your visitors send you a message on WhatsApp with the tap of a button.',
		'jetpack'
	),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'grow',
	parent: [ 'jetpack/send-a-message' ],
	keywords: [
		_x( 'whatsapp', 'keyword', 'jetpack' ),
		_x( 'messenger', 'keyword', 'jetpack' ),
		_x( 'contact', 'keyword', 'jetpack' ),
		_x( 'support', 'keyword', 'jetpack' ),
	],
	supports: {
		html: false,
		reusable: false,
		align: [ 'left', 'center', 'right' ],
	},
	attributes,
	edit,
	save,
	example: {
		attributes: {
			countryCode: '1',
			phoneNumber: '555-123-4567',
		},
	},
	deprecated: [ deprecatedV1 ],
};
