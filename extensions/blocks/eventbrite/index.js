/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';

export const URL_REGEX = /^\s*https?:\/\/(?:www\.)?(?:[a-z]{2}\.)?(?:eventbrite\.[a-z.]+)\/([^/]+)(\/[^/]+)?/i;

export const name = 'eventbrite';

// Should this be 'Eventbrite Tickets', since we may add other embeds in the future?
export const title = __( 'Eventbrite', 'jetpack' );

export const icon = '';

export const settings = {
	title,

	description: __( 'Embed Eventbrite event details and ticket checkout.', 'jetpack' ),

	// icon,

	category: 'jetpack',

	supports: {
		html: false,
	},

	attributes: {
		url: {
			type: 'string',
		},
		useModal: {
			type: 'boolean',
		},
	},

	edit,

	save: () => null,

	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node => node.nodeName === 'P' && URL_REGEX.test( node.textContent ),
				transform: node => {
					return createBlock( 'jetpack/eventbrite', {
						url: node.textContent.trim(),
					} );
				},
			},
		],
	},

	example: {
		attributes: {
			url: 'https://www.eventbrite.com/e/test-event-tickets-123456789',
		},
	},

	// responsive: false,

	// patterns: [ /^https?:\/\/(.+?\.)?eventbrite\.com(\.[a-z]{2,4})*\/.+/i ],
};
