/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { embedContentIcon, getEmbedBlockSettings } from '@wordpress/embed-block';

export const name = 'eventbrite';

// Should this be 'Eventbrite Tickets', since we may add other embeds in the future?
export const title = __( 'Eventbrite', 'jetpack' );

export const icon = embedContentIcon;

const definition = {
	title,

	description: __( 'Embed Eventbrite event details and ticket checkout.', 'jetpack' ),

	icon,

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

	responsive: false,

	patterns: [ /^https?:\/\/(.+?\.)?eventbrite\.com(\.[a-z]{2,4})*\/.+/i ],
};

export const settings = getEmbedBlockSettings( definition );
