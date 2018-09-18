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
		RawHTML: Component
	},
	i18n: {
		__: __
	},
};

/**
 * Internal dependencies
 */
const JetpackMarkdownBlockSave = require( '../js/jetpack-markdown-block-save' );

describe( 'JetpackMarkdownBlockSave', () => {
	it( 'renders the MarkdownRenderer component', () => {
		const jetpackMarkdownBlockSave = shallow( <JetpackMarkdownBlockSave attributes={ {} } /> );
		expect( jetpackMarkdownBlockSave.find( '.wp-block-jetpack-markdown-block-renderer' ) ).to.exist;
	} );
} );
