/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';
import icon from './icon';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'send-a-message';
export const title = __( 'Send A Message', 'jetpack' );
export const whatsAppURL = 'https://api.whatsapp.com/send?phone=';
export const defaultButtonText = __( 'Chat on WhatsApp', 'jetpack' );
export const defaultFirstMessage = __(
	'Hi, I got your WhatsApp information from your website.',
	'jetpack'
);

export const settings = {
	title,
	description: (
		<Fragment>
			<p>
				{ __(
					'Let your visitors to send you a message on WhatsApp with the tap of a button.',
					'jetpack'
				) }
			</p>
		</Fragment>
	),
	icon,
	category: 'jetpack',
	keywords: [
		_x( 'whatsapp', 'keyword', 'jetpack' ),
		_x( 'messenger', 'keyword', 'jetpack' ),
		_x( 'contact', 'keyword', 'jetpack' ),
		_x( 'support', 'keyword', 'jetpack' ),
	],
	supports: {
		align: [ 'left', 'center', 'right' ],
		html: false,
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
