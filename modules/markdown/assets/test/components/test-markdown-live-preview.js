/**
 * External dependencies
 */
import React, { createElement } from 'react';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';
import ReactDom from 'react-dom';

Enzyme.configure( { adapter: new Adapter() } );

const __ = ( literal ) => {
	return literal;
};

global.document.createRange = function() {
	return {
		setStart() {}
	};
};

global.window.getSelection = function() {
	return {
		addRange() {},
		removeAllRanges() {}
	};
};

global.window.wp = {
	element: {
		RawHTML: function( { children } ) {
			return createElement( 'div', {
				dangerouslySetInnerHTML: { __html: children },
			} );
		}
	},
	i18n: {
		__: __
	},
};

/**
 * Internal dependencies
 */
const MarkdownLivePreview = require( '../../js/components/markdown-live-preview' );

const markdownLightSource = 'This is *Markdown* __source__.';
const markdownLightHTML = '<div contenteditable="true"><p>This is <em><span class="wp-block-jetpack-markdown-block__live-preview__token">*</span>Markdown<span class="wp-block-jetpack-markdown-block__live-preview__token">*</span></em> <strong><span class="wp-block-jetpack-markdown-block__live-preview__token">__</span>source<span class="wp-block-jetpack-markdown-block__live-preview__token">__</span></strong>.</p></div>';
const markdownFullSource = `This is *Markdown* __source__.
It does not renders lists:
* Element 1
* Element 2
* Element 3

It does not render [ links ](https://www.automattic.com) either.
`;
const markdownFullHTML = '<div contenteditable="true"><p>This is <em><span class="wp-block-jetpack-markdown-block__live-preview__token">*</span>Markdown<span class="wp-block-jetpack-markdown-block__live-preview__token">*</span></em> <strong><span class="wp-block-jetpack-markdown-block__live-preview__token">__</span>source<span class="wp-block-jetpack-markdown-block__live-preview__token">__</span></strong>.<br>It does not renders lists:<br>* Element 1<br>* Element 2<br>* Element 3</p><p>It does not render [ links ](https://www.automattic.com) either.</p></div>';

describe( 'MarkdownLivePreview', () => {
	it( 'renders a subset of the CommonMark specification as the user types', () => {
		const markdownRenderer = mount( <MarkdownLivePreview /> );
		const markdownRendererNode = ReactDom.findDOMNode( markdownRenderer.instance() );
		markdownRendererNode.innerText = markdownLightSource;
		markdownRenderer.simulate( 'input' );
		expect( markdownRenderer.html() ).to.equal( markdownLightHTML );
	} );

	it( 'triggers a change event when its contents are updated', () => {
		const handleChangeStub = function( event ) {
			expect( event.target.value ).to.equal( markdownLightSource );
		};
		const markdownRenderer = mount( <MarkdownLivePreview onChange={ handleChangeStub } /> );
		const markdownRendererNode = ReactDom.findDOMNode( markdownRenderer.instance() );
		markdownRendererNode.innerText = markdownLightSource;
		markdownRenderer.simulate( 'input' );
	} );
	it( 'does not render complex Markdown source', () => {
		const markdownRenderer = mount( <MarkdownLivePreview /> );
		const markdownRendererNode = ReactDom.findDOMNode( markdownRenderer.instance() );
		markdownRendererNode.innerText = markdownFullSource;
		markdownRenderer.simulate( 'input' );
		expect( markdownRenderer.html() ).to.equal( markdownFullHTML );
	} );
} );
