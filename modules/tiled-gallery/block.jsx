/*global wp*/

/**
 * WordPress dependencies
 */
const { __ } = wp.i18n;

/**
 * Internal dependencies
 */
import JetpackGalleryBlockEditor from './block-edit.jsx';
import jetpackGalleryBlockSave from './block-save.jsx';

const JetpackGalleryBlockType = 'jetpack/gallery';

const settings = {
	title: __( 'Jetpack Gallery' ),
	icon: 'album',
	category: 'layout',

	attributes: {
		underlined: {
			type: 'boolean',
		},
		images: {
			type: 'array',
			'default': [],
			source: 'query',
			selector: '.tiled-gallery-item',
			query: {
				url: {
					source: 'attribute',
					selector: 'img',
					attribute: 'src',
				},
				link: {
					source: 'attribute',
					selector: 'img',
					attribute: 'data-link',
				},
				alt: {
					source: 'attribute',
					selector: 'img',
					attribute: 'alt',
					'default': '',
				},
				id: {
					source: 'attribute',
					selector: 'img',
					attribute: 'data-id',
				},
				caption: {
					type: 'array',
					source: 'children',
					selector: 'figcaption',
				},
			},
		},
	},

	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/gallery' ],
				transform: function( content ) {
					return wp.blocks.createBlock( JetpackGalleryBlockType, content );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/gallery' ],
				transform: function( content ) {
					return wp.blocks.createBlock( 'core/gallery', content );
				},
			},
		],
	},

	edit: JetpackGalleryBlockEditor,
	save: jetpackGalleryBlockSave
};

wp.blocks.registerBlockType(
	JetpackGalleryBlockType,
	settings
);
