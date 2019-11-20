/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'eventbrite';

// Should this be 'Eventbrite Tickets', since we may add other embeds in the future?
export const title = __( 'Eventbrite', 'jetpack' );

export const icon = null;

export const settings = {
	title,

	description: __( 'Embed Eventbrite event details and ticket checkout.', 'jetpack' ),

	// icon,

	category: 'jetpack',

	supports: {
		html: false,
	},

	attributes: {
		eventId: {
			type: 'string',
		},
		useModal: {
			type: 'boolean',
		},
	},

	edit,

	save: () => null,
};
