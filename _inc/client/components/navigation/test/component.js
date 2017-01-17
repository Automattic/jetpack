/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { Navigation } from '../index';

describe( 'Navigation', () => {

	let testProps = {
			userCanManageModules: false,
			userCanViewStats: false,
			route: {
				name: 'At a Glance',
				path: '/dashboard'
			},
			isModuleActivated: module => false
		};
	const wrapper = shallow( <Navigation { ...testProps } /> );

	it( 'renders a div with a className of "dops-navigation"', () => {
		expect( wrapper.find( '.dops-navigation' ) ).to.have.length( 1 );
	} );

	describe( 'User that can view Stats but not manage modules and Protect is inactive', () => {

		it( 'renders Navigation, SectionNav, NavTabs', () => {
			expect( wrapper.find( 'Navigation' ) ).to.exist;
			expect( wrapper.find( 'SectionNav' ) ).to.exist;
			expect( wrapper.find( 'NavTabs' ) ).to.exist;
		} );

		it( 'renders 1 NavItem component', () => {
			expect( wrapper.find( 'NavItem' ) ).to.have.length( 1 );
		} );

		it( 'renders only one tab: Apps', () => {
			expect( wrapper.find( 'NavItem' ).children().text() ).to.be.equal( 'Apps' );
		} );

		it( 'does not have At a Glance as selectedText', () => {
			expect( wrapper.find( 'NavTabs' ).props().selectedText ).to.not.equal( 'At a Glance' );
		} );

		it( 'has Apps as selectedText, despite having At a Glance initially', () => {
			expect( wrapper.find( 'NavTabs' ).props().selectedText ).to.be.equal( 'Apps' );
		} );

	} );

	describe( "User can't view Stats or manage modules but Protect is active", () => {

		testProps.isModuleActivated = module => true;

		const wrapperProtect = shallow( <Navigation { ...testProps } /> );

		it( 'renders 2 NavItem components', () => {
			expect( wrapperProtect.find( 'NavItem' ) ).to.have.length( 2 );
		} );

		it( 'renders tabs with At a Glance, Apps', () => {
			expect( wrapperProtect.find( 'NavItem' ).children().map( item => item.text() ).join() ).to.be.equal( 'At a Glance,Apps' );
		} );

	} );

	describe( 'User that can manage modules',  () => {

		Object.assign( testProps, {
			userCanManageModules: true,
			userCanViewStats: false,
			isModuleActivated: module => false
		} );

		const wrapperManage = shallow( <Navigation { ...testProps } /> );

		it( 'renders 3 NavItem components', () => {
			expect( wrapperManage.find( 'NavItem' ) ).to.have.length( 3 );
		} );

		it( 'renders tabs with At a Glance, Apps, Plans', () => {
			expect( wrapperManage.find( 'NavItem' ).children().map( item => item.text() ).join() ).to.be.equal( 'At a Glance,Apps,Plans' );
		} );

	} );

} );
