import { __ } from '@wordpress/i18n';
import edit from './edit';

const name = 'phone-number-input';
const settings = {
	apiVersion: 3,
	title: __( 'Phone Number input', 'jetpack-forms' ),
	description: __( 'Phone number with country code support.', 'jetpack-forms' ),
	category: 'contact-form',
	icon: 'star-filled',
	attributes: {},
	parent: [ 'jetpack/field-phone-number' ],
	allowedBlocks: [ 'jetpack/input', 'jetpack/country-list-input' ],
	supports: {
		reusable: false,
		html: false,
		color: {
			text: true,
			background: false,
		},
		typography: {
			fontSize: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
	},
	usesContext: [ 'jetpack/field-share-attributes' ],
	providesContext: {
		'jetpack/field-share-attributes': 'shareFieldAttributes',
	},
	edit,
	save: () => null,
};

export default { name, settings };
