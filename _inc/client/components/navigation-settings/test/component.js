/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { NavigationSettings } from '../index';

describe( 'NavigationSettings', () => {

	// Mock the required context type
	NavigationSettings.contextTypes = {
		router: () => {
			return {
				goBack: () => {}
			}
		}
	};

	let testProps = {
			userCanManageModules: false,
			isSubscriber: true,
			route: {
				name: 'General',
				path: '/settings'
			},
			router: {
				goBack: () => {}
			}
		};

	const wrapper = shallow( <NavigationSettings { ...testProps } /> );

	it( 'renders a div with a className of "dops-navigation"', () => {
		expect( wrapper.find( '.dops-navigation' ) ).to.have.length( 1 );
	} );

	it( 'has /general as selected navigation item, accessing through /settings', () => {
		expect( wrapper.find( 'NavItem' ).get( 0 ).props.selected ).to.be.true;
		expect( wrapper.find( 'NavItem' ).get( 0 ).props.path ).to.equal( '#general' );
	} );

	it( 'renders NavigationSettings, SectionNav, NavTabs', () => {
		expect( wrapper.find( 'NavigationSettings' ) ).to.exist;
		expect( wrapper.find( 'SectionNav' ) ).to.exist;
		expect( wrapper.find( 'NavTabs' ) ).to.exist;
	} );

	describe( 'Subscriber user', () => {

		it( 'renders only one tab: General', () => {
			expect( wrapper.find( 'NavItem' ).children().text() ).to.be.equal( 'General' );
		} );

		it( 'does not display Search', () => {
			expect( wrapper.find( 'Search' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'Editor, Author and Contributor users', () => {

		Object.assign( testProps, {
			userCanManageModules: false,
			isSubscriber: false
		} );

		const wrapper = shallow( <NavigationSettings { ...testProps } /> );

		it( 'renders tabs with General, Engagement, Writing', () => {
			expect( wrapper.find( 'NavItem' ).children().map( item => item.text() ).join() ).to.be.equal( 'General,Engagement,Writing' );
		} );

		it( 'does not display Search', () => {
			expect( wrapper.find( 'Search' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'Admin user', () => {

		Object.assign( testProps, {
			userCanManageModules: true,
			isSubscriber: false
		} );

		const wrapper = shallow( <NavigationSettings { ...testProps } /> );

		it( 'renders tabs with General, Engagement, Security, Appearance, Writing', () => {
			expect( wrapper.find( 'NavItem' ).children().map( item => item.text() ).join() ).to.be.equal( 'General,Engagement,Security,Appearance,Writing' );
		} );

		it( 'displays Search', () => {
			expect( wrapper.find( 'Search' ) ).to.have.length( 1 );
		} );

		it( 'changes hash to #search when Search is invoked', () => {
			wrapper.instance().openSearch();
			expect( window.location.hash ).to.be.equal( '#search' );
		} );

		it( 'switches to Security when the tab is clicked', () => {
			Object.assign( testProps, {
				route: {
					'name': 'Security',
					'path': '/security'
				}
			} );
			const wrapper = shallow( <NavigationSettings { ...testProps } /> );
			expect( wrapper.find( 'SectionNav' ).props().selectedText ).to.be.equal( 'Security' );
		} );

	} );

} );
