/**
 * External Dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getButtonAttributes } from '../../shared/components/button';
import colorValidator from '../../shared/colorValidator';

const urlValidator = url => ! url || url.startsWith( 'https://calendly.com/' );

export default {
	backgroundColor: {
		type: 'string',
		default: 'ffffff',
		validator: colorValidator,
	},
	hideEventTypeDetails: {
		type: 'boolean',
		default: false,
	},
	primaryColor: {
		type: 'string',
		default: '00A2FF',
		validator: colorValidator,
	},
	textColor: {
		type: 'string',
		default: '4D5055',
		validator: colorValidator,
	},
	style: {
		type: 'string',
		default: 'inline',
		validValues: [ 'inline', 'link' ],
	},
	url: {
		type: 'string',
		validator: urlValidator,
	},
	...getButtonAttributes( {
		defaultText: __( 'Schedule time with me', 'jetpack' ),
	} ),
};
