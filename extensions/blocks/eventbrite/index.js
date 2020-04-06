/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { G, Path, Rect, SVG } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import deprecated from './deprecated/v1';
import edit from './edit';
import save from './save';

// Example URLs
// https://www.eventbrite.com/e/test-event-tickets-123456789
// https://www.eventbrite.co.uk/e/test-event-tickets-123456789
export const URL_REGEX = /^\s*https?:\/\/(?:www\.)?(?:eventbrite\.[a-z.]+)\/e\/[^\/]*?(\d+)\/?(?:\?[^\/]*)?\s*$/i;

// Custom eventbrite urls use a subdomain of eventbrite.com
export const CUSTOM_URL_REGEX = /^\s*https?:\/\/(?:.+\.)?(?:eventbrite\.[a-z.]+)\/?(?:\?[^\/]*)?\s*$/i;

export const EVENTBRITE_EXAMPLE_URL = 'https://www.eventbrite.com/e/test-event-tickets-123456789';

export const name = 'eventbrite';

export const title = __( 'Eventbrite Checkout', 'jetpack' );

export const icon = {
	src: (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Rect x="0" fill="none" width="24" height="24" />
			<G id="eventbrite-icon">
				<Path d="M18.041,3.931L5.959,3C4.325,3,3,4.325,3,5.959v12.083C3,19.675,4.325,21,5.959,21l12.083-0.931C19.699,19.983,21,18.744,21,17.11V6.89C21,5.256,19.741,4.027,18.041,3.931zM16.933,8.17c-0.082,0.215-0.192,0.432-0.378,0.551c-0.188,0.122-0.489,0.132-0.799,0.132c-1.521,0-3.062-0.048-4.607-0.048c-0.152,0.708-0.304,1.416-0.451,2.128c0.932-0.004,1.873,0.005,2.81,0.005c0.726,0,1.462-0.069,1.586,0.525c0.04,0.189-0.001,0.426-0.052,0.615c-0.105,0.38-0.258,0.676-0.625,0.783c-0.185,0.054-0.408,0.058-0.646,0.058c-1.145,0-2.345,0.017-3.493,0.02c-0.169,0.772-0.328,1.553-0.489,2.333c1.57-0.005,3.067-0.041,4.633-0.058c0.627-0.007,1.085,0.194,1.009,0.85c-0.031,0.262-0.098,0.497-0.211,0.725c-0.102,0.208-0.248,0.376-0.488,0.452c-0.237,0.075-0.541,0.064-0.862,0.078c-0.304,0.014-0.614,0.008-0.924,0.016c-0.309,0.009-0.619,0.022-0.919,0.022c-1.253,0-2.429,0.08-3.683,0.073c-0.603-0.004-1.014-0.249-1.124-0.757c-0.059-0.273-0.018-0.58,0.036-0.841c0.541-2.592,1.083-5.176,1.629-7.763c0.056-0.265,0.114-0.511,0.225-0.714C9.279,7.051,9.534,6.834,9.9,6.735c0.368-0.099,0.883-0.047,1.344-0.047c0.305,0,0.612,0.008,0.914,0.016c0.925,0.026,1.817,0.03,2.747,0.053c0.304,0.007,0.615,0.016,0.915,0.016c0.621,0,1.17,0.073,1.245,0.614C17.104,7.675,17.014,7.954,16.933,8.17z" />
			</G>
		</SVG>
	),
	foreground: '#555d66',
};

export const settings = {
	title,
	description: __( 'Embed Eventbrite event details and ticket checkout.', 'jetpack' ),
	icon,
	category: 'jetpack',
	keywords: [
		_x( 'events', 'block search term', 'jetpack' ),
		_x( 'tickets', 'block search term', 'jetpack' ),
	],
	supports: {
		html: false,
		align: true,
	},
	attributes,
	edit,
	save,
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node =>
					node.nodeName === 'P' &&
					( URL_REGEX.test( node.textContent ) || CUSTOM_URL_REGEX.test( node.textContent ) ),
				transform: node =>
					createBlock( 'jetpack/eventbrite', {
						url: node.textContent.trim(),
					} ),
			},
		],
	},
	// Example is used for rendering block styles previews when using Button & Modal embed type.
	// Make sure the example has `useModal` set to true.
	example: {
		attributes: {
			url: EVENTBRITE_EXAMPLE_URL,
			eventId: 123456789,
			style: 'modal',
			text: _x( 'Register', 'verb: e.g. register for an event.', 'jetpack' ),
		},
	},
	deprecated,
};
