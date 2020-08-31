/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import whatsAppIcon from './whatsapp-button/icon';
import { extendWithPaidIcon } from '../../extended-blocks/paid-blocks/render-paid-icon';

const variations = [
	{
		isDefault: true,
		name: 'whatsapp-button',
		title: __( 'WhatsApp Button', 'jetpack' ),
		description: __(
			'Let your visitors send you messages on WhatsApp with the tap of a button.',
			'jetpack'
		),
		icon: extendWithPaidIcon( 'send-a-message', whatsAppIcon ),
		innerBlocks: [ [ 'jetpack/whatsapp-button', {} ] ],
	},
];

export default variations;
