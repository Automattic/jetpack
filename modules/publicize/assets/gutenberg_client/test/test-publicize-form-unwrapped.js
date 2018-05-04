/**
 * Unit test for PublicizeFormUnwrapped component.
 *
 * @file Tests for Gutenberg Publicize form.
 * @since  5.9.1
 */

/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { describe, it } from 'mocha';
import { spy } from 'sinon';

// wp would normally be available from Gutenberg.
global.window.wp = {
	i18n: {
		__: () => { 'mockstring' },
		_n: () => { 'mockstring' },
		sprintf: () => { 'mockstring' },
	},
	components: {
		FormToggle: null,
	}
};

/**
 * Internal dependencies
 */
// Using 'require' so global window object is picked up within file.
const PublicizeFormUnwrapped = require( '../publicize-form-unwrapped' );

const mockConnectionsEnabled = [
	{
		unique_id: '1',
		checked: true,
		disabled: false,
	},
	{
		unique_id: '2',
		checked: false,
		disabled: false,
	},
];
const mockConnectionsDisabled = [
	{
		unique_id: '1',
		checked: true,
		disabled: true,
	},
	{
		unique_id: '2',
		checked: true,
		disabled: true,
	},
];

const MAX_MESSAGE_LENGTH = 256;
const initializeSpy = spy();

describe( '', () => {
	it( 'renders form', () => {
		const form = shallow(
			<PublicizeFormUnwrapped
				staticConnections={ [] }
				initializePublicize={ initializeSpy }
				shareMessage={ '' }
				activeConnections={ [] }
			/>
		);
		expect( form.find( 'PublicizeFormUnwrapped' ) ).to.exist;
	} );

	it( 'renders 2 connections', () => {
		const form = shallow(
			<PublicizeFormUnwrapped
				staticConnections={ mockConnectionsEnabled }
				initializePublicize={ initializeSpy }
				shareMessage={ '' }
				activeConnections={ [] }
			/>
		);
		expect( form.find( '#publicize-form ul' ).children() ).to.have.lengthOf( 2 );
	} );

	it( 'form not disabled for not disabled connections', () => {
		const form = shallow(
			<PublicizeFormUnwrapped
				staticConnections={ mockConnectionsEnabled }
				initializePublicize={ initializeSpy }
				shareMessage={ '' }
				activeConnections={ [] }
			/>
		);
		expect( form.instance().isDisabled() ).to.be.false;
	} );

	it( 'form disabled for disabled connections', () => {
		const form = shallow(
			<PublicizeFormUnwrapped
				staticConnections={ mockConnectionsDisabled }
				initializePublicize={ initializeSpy }
				shareMessage={ '' }
				activeConnections={ [] }
			/>
		);
		expect( form.instance().isDisabled() ).to.be.true;
	} );

	it( 'form message displayed', () => {
		const mockMessage = 'foobar';
		const form = shallow(
			<PublicizeFormUnwrapped
				staticConnections={ mockConnectionsDisabled }
				initializePublicize={ initializeSpy }
				shareMessage={ mockMessage }
				activeConnections={ [] }
			/>
		);
		expect( form.find( 'textarea' ).props().value ).to.equal( mockMessage );
	} );

	it( 'form message class for message length under max', () => {
		const mockMessage = 'foobar';
		const form = shallow(
			<PublicizeFormUnwrapped
				staticConnections={ mockConnectionsDisabled }
				initializePublicize={ initializeSpy }
				shareMessage={ mockMessage }
				activeConnections={ [] }
			/>
		);
		const textContainer = form.find( '.jetpack-publicize-message-box' );
		expect( textContainer ).to.exist;
		const textStatusDiv = textContainer.children().find( '.jetpack-publicize-character-count' );
		expect( textStatusDiv ).to.exist;

		expect( textStatusDiv.hasClass( 'wpas-twitter-length-limit' ) ).to.be.false;
	} );

	it( 'form message class for message length over max', () => {
		const mockMessage = 'a'.repeat( MAX_MESSAGE_LENGTH );
		const form = shallow(
			<PublicizeFormUnwrapped
				staticConnections={ mockConnectionsDisabled }
				initializePublicize={ initializeSpy }
				shareMessage={ mockMessage }
				activeConnections={ [] }
			/>
		);
		const textContainer = form.find( '.jetpack-publicize-message-box' );
		expect( textContainer ).to.exist;
		const textStatusDiv = textContainer.children().find( '.jetpack-publicize-character-count' );
		expect( textStatusDiv ).to.exist;

		expect( textStatusDiv.hasClass( 'wpas-twitter-length-limit' ) ).to.be.true;
	} );
} );
