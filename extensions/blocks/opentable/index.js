/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { defaultAttributes } from './attributes';
import edit from './edit';
import icon from './icon';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'opentable';
export const title = __( 'OpenTable', 'jetpack' );

export const settings = {
	title,
	description: __( 'Allow visitors to book a reservation with OpenTable', 'jetpack' ),
	icon,
	category: 'jetpack',
	keywords: [
		__( 'opentable', 'jetpack' ),
		__( 'reservation', 'jetpack' ),
		__( 'restaurant', 'jetpack' ),
	],
	supports: {
		html: false,
	},
	edit,
	save: () => null,
	attributes: defaultAttributes,
	example: {
		attributes: {
			rid: '1',
			style: 'standard',
			iframe: true,
			domain: 'com',
			lang: 'en-US',
			newtab: false,
		},
	},
};
