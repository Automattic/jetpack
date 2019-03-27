/**
 * Internal dependencies
 */
import './editor.scss';
import TestimonialEdit from './edit';
import TestimonialSave from './save';
import { __ } from '../../utils/i18n';

export const name = 'testimonial';

export const settings = {
	title: __( 'Testimonial' ),
	description: __( '…' ),
	icon: 'embed-photo',
	category: 'jetpack',
	keywords: [ __( 'testimonial' ) ],
	supports: {},
	attributes: {
		content: {
			type: 'string',
		},
		author: {
			type: 'string',
		},
		authorMediaUrl: {
			type: 'string',
		},
		authorMediaId: {
			type: 'number',
		},
	},
	edit: TestimonialEdit,
	save: TestimonialSave,
};
