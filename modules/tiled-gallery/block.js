'use strict';

var _blockEdit = require('./block-edit.jsx');

var _blockEdit2 = _interopRequireDefault(_blockEdit);

var _blockSave = require('./block-save.jsx');

var _blockSave2 = _interopRequireDefault(_blockSave);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*global wp*/

/**
 * WordPress dependencies
 */
var __ = wp.i18n.__;

/**
 * Internal dependencies
 */

var JetpackGalleryBlockType = 'jetpack/gallery';

var settings = {
	title: __('Jetpack Gallery'),
	icon: 'format-gallery',
	category: 'layout',

	attributes: {
		columns: {
			type: 'integer',
			'default': 3
		},
		linkTo: {
			type: 'string',
			'default': 'none'
		},
		images: {
			type: 'array',
			'default': [],
			source: 'query',
			selector: '.tiled-gallery-item',
			query: {
				width: {
					source: 'attribute',
					selector: 'img',
					attribute: 'data-original-width'
				},
				height: {
					source: 'attribute',
					selector: 'img',
					attribute: 'data-original-height'
				},
				url: {
					source: 'attribute',
					selector: 'img',
					attribute: 'src'
				},
				link: {
					source: 'attribute',
					selector: 'img',
					attribute: 'data-link'
				},
				alt: {
					source: 'attribute',
					selector: 'img',
					attribute: 'alt',
					'default': ''
				},
				id: {
					source: 'attribute',
					selector: 'img',
					attribute: 'data-id'
				},
				caption: {
					type: 'array',
					source: 'children',
					selector: 'figcaption'
				}
			}
		}
	},

	transforms: {
		from: [{
			type: 'block',
			blocks: ['core/gallery'],
			transform: function transform(content) {
				return wp.blocks.createBlock(JetpackGalleryBlockType, content);
			}
		}],
		to: [{
			type: 'block',
			blocks: ['core/gallery'],
			transform: function transform(content) {
				return wp.blocks.createBlock('core/gallery', content);
			}
		}]
	},

	edit: _blockEdit2['default'],
	save: _blockSave2['default']
};

wp.blocks.registerBlockType(JetpackGalleryBlockType, settings);