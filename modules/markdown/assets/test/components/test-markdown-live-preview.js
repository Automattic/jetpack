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

const markdownSource = 'This is *Markdown* __source__.';
const markdownHTML = '<div contenteditable="true"><p>This is <em><span class="wp-block-jetpack-markdown-block__live-preview__token">*</span>Markdown<span class="wp-block-jetpack-markdown-block__live-preview__token">*</span></em> <strong><span class="wp-block-jetpack-markdown-block__live-preview__token">__</span>source<span class="wp-block-jetpack-markdown-block__live-preview__token">__</span></strong>.</p></div>';

describe( 'MarkdownLivePreview', () => {
	it( 'renders a subset of the CommonMark specification as the user types', () => {
		const markdownRenderer = mount( <MarkdownLivePreview /> );
		const markdownRendererNode = ReactDom.findDOMNode( markdownRenderer.instance() );
		markdownRendererNode.innerText = markdownSource;
		markdownRenderer.simulate( 'input' );
		expect( markdownRenderer.html() ).to.equal( markdownHTML );
	} );
} );
