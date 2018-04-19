/**
 * WordPress dependencies
 */
//import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
//import './editor.scss';

( function( wp ) {
	const {
		registerBlockType,
		// RichText,
		// BlockControls,
		// AlignmentToolbar,
		// source
	} = wp.blocks;
	const blockStyle = { backgroundColor: '#900', color: '#fff', padding: '20px' };
	const el = wp.element.createElement;

	registerBlockType( 'jetpack/markdown-block', {

		title: 'Markdown',

		description: 'We are going to have MARKDOWN!.',

		icon: wp.element.createElement(
			'svg',
			{ xmlns: 'http://www.w3.org/2000/svg', 'class': 'dashicons', width: '208', height: '128', viewBox: '0 0 208 128' },
			wp.element.createElement(
				'rect', { width: '198', height: '118', x: '5', y: '5', ry: '10', stroke: '#000', 'stroke-width': '10', fill: 'none' }
				),
			wp.element.createElement(
				'path', { d: 'M30 98v-68h20l20 25 20-25h20v68h-20v-39l-20 25-20-25v39zM155 98l-30-33h20v-35h20v35h20z' }
				)
		),

		category: 'formatting',

		attributes: {
			content: {
				type: 'string',
				source: 'property',
				selector: 'code',
				property: 'textContent',
			},
		},

		supports: {
			html: false,
		},

		edit: function() {
			return el( 'p', { style: blockStyle }, 'Hello editor.' );
		},

		save: function() {
			return el( 'p', { style: blockStyle }, 'Hello saved content.' );
		},

	} );
} )( window.wp );
