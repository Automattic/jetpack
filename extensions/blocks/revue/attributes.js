/* eslint-disable wpcalypso/import-docblock */
/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';

export default {
	revueUsername: {
		type: 'string',
	},
	text: {
		type: 'string',
		default: _x( 'Subscribe', 'verb: e.g. subscribe to a newsletter.', 'jetpack' ),
	},
	emailLabel: {
		type: 'string',
		default: __( 'Email address', 'jetpack' ),
	},
	emailPlaceholder: {
		type: 'string',
		default: __( 'Your email address…', 'jetpack' ),
	},
	firstNameLabel: {
		type: 'string',
		default: __( 'First name', 'jetpack' ),
	},
	firstNamePlaceholder: {
		type: 'string',
		default: __( 'First name… (Optional)', 'jetpack' ),
	},
	firstNameShow: {
		type: 'boolean',
		default: true,
	},
	lastNameLabel: {
		type: 'string',
		default: __( 'Last name', 'jetpack' ),
	},
	lastNamePlaceholder: {
		type: 'string',
		default: __( 'Last name… (Optional)', 'jetpack' ),
	},
	lastNameShow: {
		type: 'boolean',
		default: true,
	},
	backgroundColor: {
		type: 'string',
	},
	textColor: {
		type: 'string',
	},
	customBackgroundColor: {
		type: 'string',
	},
	customTextColor: {
		type: 'string',
	},
	borderRadius: {
		type: 'number',
	},
	gradient: {
		type: 'string',
	},
	customGradient: {
		type: 'string',
	},
};
