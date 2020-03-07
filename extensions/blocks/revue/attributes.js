/* eslint-disable wpcalypso/import-docblock */
/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getButtonAttributes } from '../../shared/components/button';

export default {
	revueUsername: {
		type: 'string',
	},
	emailLabel: {
		type: 'string',
		default: __( 'Email address', 'jetpack' ),
	},
	emailPlaceholder: {
		type: 'string',
		default: __( 'Enter your email address', 'jetpack' ),
	},
	firstNameLabel: {
		type: 'string',
		default: __( 'First name', 'jetpack' ),
	},
	firstNamePlaceholder: {
		type: 'string',
		default: __( 'Enter your first name', 'jetpack' ),
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
		default: __( 'Enter your last name', 'jetpack' ),
	},
	lastNameShow: {
		type: 'boolean',
		default: true,
	},
	...getButtonAttributes( {
		defaultText: _x( 'Subscribe', 'verb: e.g. subscribe to a newsletter.', 'jetpack' ),
	} ),
};
