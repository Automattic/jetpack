/**
 * External dependencies
 */
import React, { Component } from 'react';
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
		Component: Component
	},
	i18n: {
		__: __
	},
};

/**
 * Internal dependencies
 */
const JetpackMarkdownBlockEditor = require( '../js/jetpack-markdown-block-editor' );

describe( 'JetpackMarkdownBlockEditor', () => {
	it( 'renders the MarkdownLivePreview component', () => {
		const jetpackMarkdownBlockEditor = shallow( <JetpackMarkdownBlockEditor attributes={ { source: '' } } /> );
		expect( jetpackMarkdownBlockEditor.find( '.wp-block-jetpack-markdown-block-live-preview' ) ).to.exist;
	} );
} );
