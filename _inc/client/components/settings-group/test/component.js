/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow, render } from 'enzyme';

/**
 * Internal dependencies
 */
import { SettingsGroup } from '../index';

describe( 'SettingsGroup', () => {
	let testProps,
		settingsGroup;

	before( () => {
		testProps = {
			support: 'https://jetpack.com/support/protect',
			module: { module: 'protect' },
			isModuleFound: () => true
		};

		settingsGroup = shallow( <SettingsGroup { ...testProps } /> );
	} );

	it( 'the learn more icon is linked to the correct URL', () => {
		expect(
			settingsGroup.find( 'Button' ).get(0).props.href
		).to.be.equal( 'https://jetpack.com/support/protect' );
	} );

	describe( 'when the module is not found', () => {
		before( () => {
			testProps = {
				...testProps,
				isModuleFound: () => false
			};

			settingsGroup = render( <SettingsGroup { ...testProps } /> );
		} );

		it( 'returns null from the render method', () => {
			expect( settingsGroup.html() ).to.equal( '<noscript></noscript>' );
		} );
	} );
} );
