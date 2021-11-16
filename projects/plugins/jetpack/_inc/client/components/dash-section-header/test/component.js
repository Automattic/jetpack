/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { DashSectionHeader } from '../index';

describe( 'DashSectionHeader', () => {

	let testProps = {
		label: 'Site Stats',
		settingsPath: '',
		externalLinkPath: '',
		externalLink: '',
		siteRawUrl: 'https://example.org/'
	};

	const wrapper = shallow( <DashSectionHeader { ...testProps } /> );

	it( 'is correctly rendered', () => {
		expect( wrapper.find( 'DashSectionHeader' ) ).to.exist;
		expect( wrapper.find( '.jp-dash-section-header' ) ).to.have.length( 1 );
	} );

	it( 'has the right title', () => {
		expect( wrapper.find( 'h2.jp-dash-section-header__name' ).text() ).to.be.equal( 'Site Stats' );
	} );

	it( 'does not display a linked icon for Site Stats', () => {
		expect( wrapper.find( 'Gridicon' ) ).to.have.length( 0 );
		expect( wrapper.find( 'a.jp-dash-section-header__settings' ) ).to.have.length( 0 );
	} );

	it( 'does not display a external link if one is not supplied', () => {
		expect( wrapper.find( 'a.jp-dash-section-header__external-link' ) ).to.have.length( 0 );
	} );

	describe( 'renders additional elements when settings path and external links are supplied', () => {
		let externalPath = getRedirectUrl( 'calypso-settings-security', { site: testProps.siteRawUrl } );
		testProps = Object.assign( testProps, {
			settingsPath: '#security',
			externalLinkPath: externalPath,
			externalLink: 'External'
		} );

		const wrapper = shallow( <DashSectionHeader { ...testProps } /> );

		it( 'there is an external link', () => {
			expect( wrapper.find( 'a.jp-dash-section-header__external-link' ) ).to.have.length( 1 );
			expect( wrapper.find( 'a.jp-dash-section-header__external-link' ).props().href ).to.be.equal( externalPath );
			expect( wrapper.find( 'a.jp-dash-section-header__external-link' ).text() ).to.be.equal( 'External' );
		} );
	} );

} );
