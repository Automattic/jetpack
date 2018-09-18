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
	components: {
		ButtonGroup: Component
	},
	editor: {
		BlockControls: Component,
		PlainText: Component
	},
	element: {
		Component: Component,
	},
	i18n: {
		__: __
	},
};

/**
 * Internal dependencies
 */
const JetpackMarkdownBlockEditor = require( '../js/jetpack-markdown-block-editor' );

const blockClassName = 'wp-block-jetpack-markdown-block';

const markdownSource = 'Some **markdown** _source_.';

describe( 'JetpackMarkdownBlockEditor', () => {
	it( 'renders the placeholder when no markdown source is provied', () => {
		const jetpackMarkdownBlockEditor = shallow( <JetpackMarkdownBlockEditor className={ blockClassName } attributes={ {} } /> );
		expect( jetpackMarkdownBlockEditor.find( `.${ blockClassName }__placeholder` ).length ).to.equal( 1 );
	} );

	it( 'renders the MarkdownLivePreview component', () => {
		const jetpackMarkdownBlockEditor = shallow( <JetpackMarkdownBlockEditor className={ blockClassName } attributes={ { source: markdownSource } } /> );
		expect( jetpackMarkdownBlockEditor.find( `.${ blockClassName }__editor` ).length ).to.equal( 1 );
		expect( jetpackMarkdownBlockEditor.find( `.${ blockClassName }__preview` ).length ).to.equal( 0 );
	} );

	it( 'shows the preview panel when the preview tab is activated', () => {
		const jetpackMarkdownBlockEditor = shallow( <JetpackMarkdownBlockEditor className={ blockClassName } attributes={ { source: markdownSource } } /> );
		jetpackMarkdownBlockEditor.find( '.wp-block-jetpack-markdown-block__preview-button' ).simulate( 'click' );
		expect( jetpackMarkdownBlockEditor.find( `.${ blockClassName }__editor` ).length ).to.equal( 0 );
		expect( jetpackMarkdownBlockEditor.find( `.${ blockClassName }__preview` ).length ).to.equal( 1 );
	} );
} );
