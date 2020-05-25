/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';
import icon from './icon';
import { supportsCollections } from '../../../shared/block-category';
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
		'Let your visitors to send you a message on WhatsApp with the tap of a button.',
		'jetpack'
	),
	icon,
	category: supportsCollections() ? 'grow' : 'jetpack',
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
	},
	attributes,
	edit,
	save: save,
	example: {
		attributes: {
			countryCode: '1',
			phoneNumber: '555-123-4567',
		},
	},
};
