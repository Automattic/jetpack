/**
 * External dependencies
 */
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getButtonAttributes } from '../../shared/components/button';

const urlValidator = url => ! url || url.startsWith( 'http' );

export default {
	url: {
		type: 'string',
		validator: urlValidator,
	},
	eventId: {
		type: 'number',
	},
	useModal: {
		type: 'boolean',
	},
	...getButtonAttributes( {
		defaultText: _x( 'Register', 'verb: e.g. register for an event.', 'jetpack' ),
	} ),
};
