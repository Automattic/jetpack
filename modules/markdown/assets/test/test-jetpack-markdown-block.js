/**
 * External dependencies
 */
import { Component, createElement } from 'react';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { stub } from 'sinon';

const __ = ( literal ) => {
	return literal;
};

const registerBlockTypeSpy = stub();

global.window.wp = {
	blocks: {
		registerBlockType: registerBlockTypeSpy
	},
	element: {
		RawHTML: {},
		Component: Component
	},
	i18n: {
		__: __
	},
};

/**
 * Internal dependencies
 */
require( '../js/jetpack-markdown-block' );
const JetpackMarkdownBlockEditor = require( '../js/jetpack-markdown-block-editor' );
const JetpackMarkdownBlockSave = require( '../js/jetpack-markdown-block-save' );

describe( '', () => {
	it( 'registers the markdown block', () => {
		expect( registerBlockTypeSpy ).to.have.been.calledWith(
			'jetpack/markdown-block',
			{
				title: __( 'Markdown' ),
				description: [
					__( 'Write your content in plain-text Markdown syntax.' ),
					createElement( 'p', {}, createElement( 'a', { href: 'https://en.support.wordpress.com/markdown-quick-reference/' }, 'Support Reference' ) )
				],
				icon: createElement(
					'svg', {
						xmlns: 'http://www.w3.org/2000/svg',
						'class': 'dashicon',
						width: '20',
						height: '20',
						viewBox: '0 0 208 128',
						stroke: 'currentColor'
					},
					[
						createElement(
							'rect', {
								width: '198',
								height: '118',
								x: '5',
								y: '5',
								ry: '10',
								'stroke-width': '10',
								fill: 'none'
							} ),
						createElement(
							'path', {
								d: 'M30 98v-68h20l20 25 20-25h20v68h-20v-39l-20 25-20-25v39zM155 98l-30-33h20v-35h20v35h20z'
							}
						)
					]
				),
				category: 'formatting',
				attributes: {
					source: { type: 'string' }
				},
				edit: JetpackMarkdownBlockEditor,
				save: JetpackMarkdownBlockSave
			}
		);
	} );
} );
