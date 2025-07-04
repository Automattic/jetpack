import { __ } from '@wordpress/i18n';
import edit from './edit';

const name = 'rating-input';

const settings = {
	apiVersion: 3,
	title: __( 'Rating input', 'jetpack-forms' ),
	description: __( 'Interactive star rating row.', 'jetpack-forms' ),
	parent: [ 'jetpack/field-rating' ],
	category: 'contact-form',
	icon: 'star-filled',
	attributes: {
		max: { type: 'number', default: 5 },
		default: { type: 'number', default: 0 },
	},
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

	edit,
	save: () => null,
};

export default { name, settings };
