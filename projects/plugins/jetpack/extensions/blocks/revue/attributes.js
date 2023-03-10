import { __ } from '@wordpress/i18n';

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
};
