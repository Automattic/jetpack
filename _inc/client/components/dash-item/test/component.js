/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DashItem } from '../index';

describe( 'DashItem', () => {

	let testProps = {
		label: 'Monitor',
		module: 'monitor',
		status: '',
		statusText: '',
		disabled: true,
		pro: true,
		isDevMode: false,
		href: 'https://jetpack.com/',
		userCanToggle: true,
		isModuleActivated: () => true,
		isTogglingModule: () => true,
		toggleModule: () => false,
		siteAdminUrl: 'https://example.org/wp-admin/',
		siteRawUrl: 'https://example.org/'
	};

	const wrapper = shallow( <DashItem { ...testProps } /> );

	it( 'has the right label for header', () => {
		expect( wrapper.find( 'SectionHeader' ) ).to.have.length( 1 );
		expect( wrapper.find( 'SectionHeader' ).props().label ).to.be.equal( 'Monitor' );
	} );

	it( 'the card body is built and has its href property correctly set', () => {
		expect( wrapper.find( 'Card' ) ).to.have.length( 1 );
	} );

	it( 'the href property for the card body is correctly set', () => {
		expect( wrapper.find( '.jp-dash-item__card' ).props().href ).to.be.equal( 'https://jetpack.com/' );
	} );

	it( 'the top component has classes properly set when is disabled', () => {
		let classes = wrapper.find( '.jp-dash-item' ).props().className;
		expect( classes ).to.have.string( 'jp-dash-item' );
		expect( classes ).to.have.string( 'jp-dash-item__disabled' );
	} );

	describe( 'when site is connected, is a PRO module, user can toggle', () => {

		it( 'displays a PRO button for a PRO feature', () => {
			expect( wrapper.find( 'SectionHeader' ).props().cardBadge.type.displayName ).to.be.equal( 'Button' );
		} );

		it( 'the button for a PRO feature is linked to #/plans', () => {
			expect( wrapper.find( 'SectionHeader' ).props().cardBadge.props.href ).to.be.equal( '#/plans' );
		} );

		it( 'does not display a toggle', () => {
			expect( wrapper.find( 'ModuleToggle' ) ).to.have.length( 0 );
		} );

		let proStatus = wrapper.find( 'Connect(ProStatus)' );
		it( 'displays the status', () => {
			expect( proStatus ).to.have.length( 1 );
		} );

		it( 'the badge references the module', () => {
			expect( proStatus.props().proFeature ).to.be.equal( 'monitor' );
		} );

		it( 'the admin URL is correct', () => {
			expect( proStatus.props().siteAdminUrl ).to.be.equal( testProps.siteAdminUrl );
		} );

	} );

	describe( 'when site is connected, is a PRO module, user can not toggle', () => {

		testProps = Object.assign( testProps, {
			userCanToggle: false
		} );

		const wrapper = shallow( <DashItem { ...testProps } /> );

		it( 'displays a toggle for users that can toggle', () => {
			expect( wrapper.find( 'ModuleToggle' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'when site is connected, not a PRO module, user can toggle', () => {

		testProps = Object.assign( testProps, {
			pro: false,
			userCanToggle: true
		} );

		const wrapper = shallow( <DashItem { ...testProps } /> );

		it( 'displays a toggle for users that can toggle', () => {
			expect( wrapper.find( 'ModuleToggle' ) ).to.have.length( 1 );
		} );

		it( 'the toggle references the module this card belongs to', () => {
			expect( wrapper.find( 'ModuleToggle' ).props().slug ).to.be.equal( 'monitor' );
		} );

	} );

	describe( 'when site is connected, not a PRO module, user can not toggle', () => {

		testProps = Object.assign( testProps, {
			userCanToggle: false
		} );

		const wrapper = shallow( <DashItem { ...testProps } /> );

		it( 'if user can not toggle, it does not display a toggle', () => {
			expect( wrapper.find( 'ModuleToggle' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'when site is in Dev Mode, not a PRO module, user can not toggle', () => {

		testProps = Object.assign( testProps, {
			isDevMode: true
		} );

		const wrapper = shallow( <DashItem { ...testProps } /> );

		it( 'does not display the PRO button linked to #/plans when site is in Dev Mode', () => {
			expect( wrapper.find( 'SectionHeader' ).props().cardBadge ).to.have.length( 0 );
		} );

		it( 'does not display a toggle', () => {
			expect( wrapper.find( 'ModuleToggle' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'if this is the DashItem for Manage module', () => {

		testProps = Object.assign( testProps, {
			module: 'manage',
			label: 'Manage',
			status: 'is-warning',
			userCanToggle: true
		} );

		const wrapper = shallow( <DashItem { ...testProps } /> );

		it( "shows a warning badge when status is 'is-warning'", () => {
			expect( wrapper.find( 'SimpleNotice' ) ).to.have.length( 1 );
		} );

		it( 'when Manage is deactivated, the warning badge is linked to Plugins screen in WordPress.com', () => {
			expect( wrapper.find( 'SectionHeader' ).find( 'a' ).props().href ).to.be.equal( 'https://wordpress.com/plugins/' + testProps.siteRawUrl );
		} );

		it( 'when Manage is deactivated, the warning badge is linked to Plugins screen in WP Admin', () => {
			expect( shallow( <DashItem { ...testProps } isModuleActivated={ () => false } /> ).find( 'SectionHeader' ).find( 'a' ).props().href ).to.be.equal( testProps.siteAdminUrl + 'plugins.php' );
		} );

		it( "when status is 'is-working', the warning badge has an 'active' label", () => {
			expect( shallow( <DashItem { ...testProps } status="is-working" /> ).find( 'SectionHeader' ).find( '.jp-dash-item__active-label' ) ).to.have.length( 1 );
		} );

	} );

} );