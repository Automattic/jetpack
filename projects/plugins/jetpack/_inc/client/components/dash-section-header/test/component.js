import { getRedirectUrl } from '@automattic/jetpack-components';
import { shallow } from 'enzyme';
import React from 'react';
import { DashSectionHeader } from '../index';

describe( 'DashSectionHeader', () => {
	let testProps = {
		label: 'Site Stats',
		settingsPath: '',
		externalLinkPath: '',
		externalLink: '',
		siteRawUrl: 'https://example.org/',
	};

	const wrapper = shallow( <DashSectionHeader { ...testProps } /> );

	it( 'is correctly rendered', () => {
		expect( wrapper.find( 'DashSectionHeader' ) ).toBeDefined();
		expect( wrapper.find( '.jp-dash-section-header' ) ).toHaveLength( 1 );
	} );

	it( 'has the right title', () => {
		expect( wrapper.find( 'h2.jp-dash-section-header__name' ).text() ).toBe( 'Site Stats' );
	} );

	it( 'does not display a linked icon for Site Stats', () => {
		expect( wrapper.find( 'Gridicon' ) ).toHaveLength( 0 );
		expect( wrapper.find( 'a.jp-dash-section-header__settings' ) ).toHaveLength( 0 );
	} );

	it( 'does not display a external link if one is not supplied', () => {
		expect( wrapper.find( 'a.jp-dash-section-header__external-link' ) ).toHaveLength( 0 );
	} );

	describe( 'renders additional elements when settings path and external links are supplied', () => {
		const externalPath = getRedirectUrl( 'calypso-settings-security', {
			site: testProps.siteRawUrl,
		} );
		testProps = Object.assign( testProps, {
			settingsPath: '#security',
			externalLinkPath: externalPath,
			externalLink: 'External',
		} );

		const wrapper2 = shallow( <DashSectionHeader { ...testProps } /> );

		it( 'there is an external link', () => {
			expect( wrapper2.find( 'a.jp-dash-section-header__external-link' ) ).toHaveLength( 1 );
			expect( wrapper2.find( 'a.jp-dash-section-header__external-link' ).props().href ).toEqual(
				externalPath
			);
			expect( wrapper2.find( 'a.jp-dash-section-header__external-link' ).text() ).toBe(
				'External'
			);
		} );
	} );
} );
