/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
import renderMaterialIcon from '../../shared/render-material-icon';

const variations = [
	{
		name: 'contact-form',
		title: __( 'Contact Form' ),
		description: __( 'Add a contact form to your page.', 'jetpack' ),
		isDefault: true,
		icon: renderMaterialIcon(
			<Path d="M13 7.5h5v2h-5zm0 7h5v2h-5zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM11 6H6v5h5V6zm-1 4H7V7h3v3zm1 3H6v5h5v-5zm-1 4H7v-3h3v3z" />
		),
		innerBlocks: [
			[ 'jetpack/field-name', { required: true } ],
			[ 'jetpack/field-email', { required: true } ],
			[ 'jetpack/field-url', {} ],
			[ 'jetpack/field-textarea', {} ],
		],
		attributes: {
			submitButtonText: __( 'Contact Us', 'jetpack' ),
		},
	},

	// TODO: This is not yet a real variation.
	{
		name: 'rsvp-form',
		title: __( 'RSVP Form' ),
		description: __( 'Add an RSVP form to your page', 'jetpack' ),
		icon: renderMaterialIcon(
			<Path d="M13 7.5h5v2h-5zm0 7h5v2h-5zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM11 6H6v5h5V6zm-1 4H7V7h3v3zm1 3H6v5h5v-5zm-1 4H7v-3h3v3z" />
		),
		innerBlocks: [
			[ 'jetpack/field-name', { required: true } ],
			[ 'jetpack/field-email', { required: true } ],
			[ 'jetpack/field-textarea', { label: __( 'RSVP Details', 'jetpack' ) } ],
		],
		attributes: {
			submitButtonText: __( 'Send RSVP', 'jetpack' ),
		},
	},

	// TODO:
	// Registration, Booking, Order, Feedback
];

export default variations;
