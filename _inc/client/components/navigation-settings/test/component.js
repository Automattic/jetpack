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
		},
		isModuleActivated: () => true,
		siteConnectionStatus: true,
		siteRawUrl: 'example.org',
		siteAdminUrl: 'https://example.org/wp-admin/'
	};

	describe( 'initially', () => {
		const wrapper = shallow( <NavigationSettings { ...testProps } /> );

		it( 'renders a div with a className of "dops-navigation"', () => {
			expect( wrapper.find( '.dops-navigation' ) ).to.have.length( 1 );
		} );

		it( 'renders NavigationSettings, SectionNav, NavTabs', () => {
			expect( wrapper.find( 'NavigationSettings' ) ).to.exist;
			expect( wrapper.find( 'SectionNav' ) ).to.exist;
			expect( wrapper.find( 'NavTabs' ) ).to.exist;
		} );
	} );

	describe( 'for a Subscriber user', () => {
		const wrapper = shallow( <NavigationSettings { ...testProps } /> );

		it( 'does not render Settings tabs', () => {
			expect( wrapper.find( 'NavItem' ) ).to.have.length( 0 );
		} );

		it( 'does not display Search', () => {
			expect( wrapper.find( 'Search' ) ).to.have.length( 0 );
		} );
	} );

	describe( 'for Editor, Author and Contributor users', () => {

		Object.assign( testProps, {
			userCanManageModules: false,
			isSubscriber: false
		} );

		const wrapper = shallow( <NavigationSettings { ...testProps } /> );

		it( 'renders tabs with Writing', () => {
			expect( wrapper.find( 'NavItem' ).children().nodes.filter( item => 'string' === typeof item ).every( item => [ 'Writing' ].includes( item ) ) ).to.be.true;
		} );

		it( 'has /writing as selected navigation item, accessing through /settings', () => {
			expect( wrapper.find( 'NavItem' ).get( 0 ).props.selected ).to.be.true;
			expect( wrapper.find( 'NavItem' ).get( 0 ).props.path ).to.equal( '#writing' );
		} );

		it( 'does not display Search', () => {
			expect( wrapper.find( 'Search' ) ).to.have.length( 0 );
		} );
	} );

	describe( 'for an Admin user', () => {

		Object.assign( testProps, {
			userCanManageModules: true,
			isSubscriber: false
		} );

		const wrapper = shallow( <NavigationSettings { ...testProps } /> );

		it( 'renders tabs with Discussion, Security, Traffic, Writing, Sharing', () => {
			expect( wrapper.find( 'NavItem' ).children().nodes.filter( item => 'string' === typeof item ).every( item => [ 'Writing', 'Discussion', 'Traffic', 'Security', 'Sharing' ].includes( item ) ) ).to.be.true;
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
					name: 'Security',
					path: '/security'
				}
			} );
			const wrapper = shallow( <NavigationSettings { ...testProps } /> );
			expect( wrapper.find( 'SectionNav' ).props().selectedText ).to.be.equal( 'Security' );
		} );
	} );

	describe( 'the Sharing link', () => {

		it( 'is rendered if Publicize is active', () => {
			const wrapper = shallow( <NavigationSettings { ...testProps } isModuleActivated={ m => 'publicize' === m } /> );
			expect( wrapper.find( 'NavItem' ).children().nodes.filter( item => 'string' === typeof item ).every( item => [ 'General', 'Writing', 'Discussion', 'Traffic', 'Security', 'Sharing' ].includes( item ) ) ).to.be.true;
		} );

		it( 'is rendered if Sharing is active', () => {
			const wrapper = shallow( <NavigationSettings { ...testProps } isModuleActivated={ m => 'sharing' === m } /> );
			expect( wrapper.find( 'NavItem' ).children().nodes.filter( item => 'string' === typeof item ).every( item => [ 'General', 'Writing', 'Discussion', 'Traffic', 'Security', 'Sharing' ].includes( item ) ) ).to.be.true;
		} );

		it( 'is not rendered if Publicize and Sharing are inactive', () => {
			const wrapper = shallow( <NavigationSettings { ...testProps } isModuleActivated={ () => false } /> );
			expect( wrapper.find( 'NavItem' ).children().nodes.filter( item => 'string' === typeof item ).every( item => [ 'General', 'Writing', 'Discussion', 'Traffic', 'Security' ].includes( item ) ) ).to.be.true;
		} );

		describe( 'if site is connected', () => {

			const wrapper = shallow( <NavigationSettings { ...testProps } /> );

			it( 'points to Calypso', () => {
				expect( wrapper.find( 'NavItem' ).nodes.pop().props.path ).to.be.equal( 'https://wordpress.com/sharing/example.org' );
			} );

			it( 'has an "external" icon', () => {
				expect( wrapper.find( 'NavItem' ).children().find( 'Gridicon' ) ).to.have.length( 1 );
			} );
		} );

		describe( 'if site is in dev mode', () => {

			const wrapper = shallow( <NavigationSettings { ...testProps } siteConnectionStatus={ false } /> );

			it( 'points to WP Admin', () => {
				expect( wrapper.find( 'NavItem' ).nodes.pop().props.path ).to.be.equal( 'https://example.org/wp-admin/options-general.php?page=sharing' );
			} );

			it( 'does not have an icon', () => {
				expect( wrapper.find( 'NavItem' ).children().find( 'Gridicon' ) ).to.have.length( 0 );
			} );
		} );
	} );
} );
