/**
 * External dependencies
 */
import React, { createElement } from 'react';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import Enzyme, { shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

Enzyme.configure( { adapter: new Adapter() } );

const __ = ( literal ) => {
	return literal;
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
const MarkdownRenderer = require( '../../js/components/markdown-renderer' );

const markdownSource = 'This is *Markdown* __source__.';
const markdownHTML = `<div><p>This is <em>Markdown</em> <strong>source</strong>.</p>
</div>`;

describe( 'MarkdownRenderer', () => {
	it( 'renders HTML from Markdown source', () => {
		const markdownRenderer = shallow( <MarkdownRenderer source={ markdownSource } /> );
		expect( markdownRenderer.html() ).to.equal( markdownHTML );
	} );
} );
