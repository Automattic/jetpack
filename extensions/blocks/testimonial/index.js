/**
 * External dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { filter } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';
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
		{ name: 'standard', label: _x( 'Standard', 'block style' ) },
		{ name: 'spotlight', label: _x( 'Spotlight', 'block style' ) },
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
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/quote', 'core/pullquote' ],
				transform: attributes => {
					const citationParts = ( attributes.citation || '' ).split( ', ' );
					const author = citationParts.length === 2 ? citationParts[ 0 ] : attributes.citation;
					const title = citationParts.length === 2 ? citationParts[ 1 ] : null;
					return createBlock( 'jetpack/testimonial', {
						content: attributes.value,
						name: author,
						title,
					} );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/pullquote' ],
				transform: ( { content, name: author, title } ) => {
					return createBlock( 'core/pullquote', {
						value: '<p>' + content + '</p>',
						citation: filter( [ author, title ] ).join( ', ' ),
					} );
				},
			},
			{
				type: 'block',
				blocks: [ 'core/quote' ],
				transform: ( { content, name: author, title } ) => {
					return createBlock( 'core/quote', {
						value: '<p>' + content + '</p>',
						citation: filter( [ author, title ] ).join( ', ' ),
					} );
				},
			},
		],
	},
};
