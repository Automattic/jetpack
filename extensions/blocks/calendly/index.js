/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import icon from './icon';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'calendly';
export const title = __( 'Calendly', 'jetpack' );
export const settings = {
	title,
	description: __( 'Embed a calendar for customers to schedule appointments', 'jetpack' ),
	icon,
	category: 'jetpack',
	keywords: [
		__( 'calendar', 'jetpack' ),
		__( 'schedule', 'jetpack' ),
		__( 'appointments', 'jetpack' ),
	],
	supports: {
		align: true,
		alignWide: false,
		html: false,
	},
	edit,
	save: () => null,
	attributes,
	example: {
		attributes: {
			submitButtonText: __( 'Schedule time with me', 'jetpack' ),
			hideEventTypeDetails: false,
			style: 'inline',
			url: 'https://calendly.com/wordpresscom/jetpack-block-example',
		},
	},
};
