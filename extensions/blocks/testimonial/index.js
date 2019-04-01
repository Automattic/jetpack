/**
 * Internal dependencies
 */
import './editor.scss';
import TestimonialEdit from './edit';
import TestimonialSave from './save';
import { __, _x } from '../../utils/i18n';

export const name = 'testimonial';

export const settings = {
	title: __( 'Testimonial' ),
	description: __( 'Lets you display testimonials from customers and clients.' ),
	icon: 'embed-photo',
	category: 'jetpack',
	keywords: [ __( 'testimonial' ) ],
	styles: [
		{ name: 'quote', label: _x( 'Quote', 'block style' ), isDefault: true },
		{ name: 'large', label: _x( 'Large', 'block style' ) },
		{ name: 'small', label: _x( 'Small', 'block style' ) },
		{ name: 'spotlight', label: _x( 'Spotlight', 'block style' ) },
		{ name: 'normal', label: _x( 'Normal', 'block style' ) },
	],
	attributes: {
		align: {
			type: 'string',
		},
		content: {
			type: 'string',
			source: 'html',
			selector: '.wp-block-jetpack-testimonial__content',
		},
		name: {
			type: 'string',
			source: 'html',
			selector: '.wp-block-jetpack-testimonial__name',
		},
		title: {
			type: 'string',
			source: 'html',
			selector: '.wp-block-jetpack-testimonial__title',
		},
		mediaUrl: {
			type: 'string',
			source: 'attribute',
			attribute: 'src',
			selector: 'img',
		},
		mediaId: {
			type: 'number',
		},
	},
	edit: TestimonialEdit,
	save: TestimonialSave,
};
