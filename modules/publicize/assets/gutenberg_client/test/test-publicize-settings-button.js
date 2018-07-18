/**
 * Unit test for PublicizeSettingButton component.
 *
 * @file Tests for Gutenberg Publicize settings button.
 * @since  5.9.1
 */

/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { describe, it } from 'mocha';

// wp.i18n would normally be available from Gutenberg.
global.window.wp = {
	i18n: {
		__: () => { 'mockstring' },
	},
};

/**
 * Internal dependencies
 */
// Using 'require' so global window object is picked up within file.
const PublicizeSettingsButton = require( '../publicize-settings-button' );

describe( '', () => {
	it( 'renders button', () => {
		const settingsButton = shallow( <PublicizeSettingsButton /> );
		expect( settingsButton.find( 'PublicizeSettingsButton' ) ).to.exist;
	} );
} );
