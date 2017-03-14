/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import { NavigationSettings } from '../index';

describe( 'NavigationSettings', () => {
	let wrapper,
		testProps,
		options;

	before( () => {
		// Mock the required context type
		NavigationSettings.contextTypes = {
			router: () => {
				return {
					goBack: () => {},
					listen: () => {}
				};
			}
		};

		testProps = {
			userCanManageModules: false,
			isSubscriber: true,
			route: {
				name: 'General',
				path: '/settings'
			},
			router: {
				goBack: () => {},
				listen: () => {}
			},
			isModuleActivated: () => true,
			siteConnectionStatus: true,
			siteRawUrl: 'example.org',
			siteAdminUrl: 'https://example.org/wp-admin/',
			searchForTerm: () => {}
		};

		options = {
			context: {
				router: NavigationSettings.contextTypes.router()
			}
		};

		window.location.hash = '#settings';
		wrapper = shallow( <NavigationSettings { ...testProps } />, options );
	} );

	describe( 'initially', () => {
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
		it( 'does not render Settings tabs', () => {
			expect( wrapper.find( 'NavItem' ) ).to.have.length( 0 );
		} );

		it( 'does not display Search', () => {
			expect( wrapper.find( 'Search' ) ).to.have.length( 0 );
		} );
	} );

	describe( 'for Editor, Author and Contributor users', () => {

		before( () => {
			Object.assign( testProps, {
				userCanManageModules: false,
				isSubscriber: false
			} );

			wrapper = shallow( <NavigationSettings { ...testProps } />, options );
		} );

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
		before( () => {
			Object.assign( testProps, {
				userCanManageModules: true,
				isSubscriber: false
			} );

			wrapper = shallow( <NavigationSettings { ...testProps } />, options );
		} );

		it( 'renders tabs with Discussion, Security, Traffic, Writing, Sharing', () => {
			expect(
				wrapper
					.find( 'NavItem' )
					.children()
					.nodes
					.filter( item => 'string' === typeof item )
					.every(
						item => [
							'Writing',
							'Discussion',
							'Traffic',
							'Security',
							'Sharing'
						].includes( item )
					)
			).to.be.true;
		} );

		it( 'displays Search', () => {
			expect( wrapper.find( 'Search' ) ).to.have.length( 1 );
		} );

		describe( 'when Search is opened', () => {
			let instance;

			before( () => {
				instance = wrapper.instance();
			} );

			it( 'does not change hash to #search', () => {
				expect( window.location.hash ).to.be.equal( '#settings' );
			} );

			describe( 'and a search term is opened', () => {
				it( 'adds a search term in a query string', () => {
					instance.doSearch( 'search term' );
					expect( window.location.hash ).to.be.equal( '#settings?term=search term' );
				} );

				describe( 'and a search term is deleted', () => {
					it( 'changes hash back to #settings', () => {
						instance.doSearch( '' );
						expect( window.location.hash ).to.be.equal( '#settings' );
					} );
				} );
			} );

		} );

		it( 'switches to Security when the tab is clicked', () => {
			Object.assign( testProps, {
				route: {
					name: 'Security',
					path: '/security'
				}
			} );
			wrapper = shallow( <NavigationSettings { ...testProps } />, options );
			expect( wrapper.find( 'SectionNav' ).props().selectedText ).to.be.equal( 'Security' );
		} );
	} );

	describe( 'the Sharing link', () => {

		it( 'is rendered if Publicize is active', () => {
			wrapper = shallow(
				<NavigationSettings
					{ ...testProps }
					isModuleActivated={ m => 'publicize' === m }
				/>,
				options
			);
			expect(
				wrapper
					.find( 'NavItem' )
					.children()
					.nodes
					.filter( item => 'string' === typeof item )
					.every(
						item => [
							'General',
							'Writing',
							'Discussion',
							'Traffic',
							'Security',
							'Sharing'
						].includes( item )
					)
			).to.be.true;
		} );

		it( 'is rendered if Sharing is active', () => {
			wrapper = shallow(
				<NavigationSettings
					{ ...testProps }
					isModuleActivated={ m => 'sharing' === m }
				/>,
				options
			);
			expect(
				wrapper
					.find( 'NavItem' )
					.children()
					.nodes
					.filter( item => 'string' === typeof item )
					.every(
						item => [
							'General',
							'Writing',
							'Discussion',
							'Traffic',
							'Security',
							'Sharing'
						].includes( item )
					)
			).to.be.true;
		} );

		it( 'is not rendered if Publicize and Sharing are inactive', () => {
			const wrapper = shallow(
				<NavigationSettings
					{ ...testProps }
					isModuleActivated={ () => false }
				/>,
				options
			);
			expect(
				wrapper
					.find( 'NavItem' )
					.children()
					.nodes
					.filter( item => 'string' === typeof item )
					.every(
						item => [
							'General',
							'Writing',
							'Discussion',
							'Traffic',
							'Security'
						].includes( item )
					)
			).to.be.true;
		} );

		describe( 'if site is connected', () => {

			before( () => {
				wrapper = shallow( <NavigationSettings { ...testProps } />, options );
			} );

			it( 'points to Calypso', () => {
				expect( wrapper.find( 'NavItem' ).nodes.pop().props.path ).to.be.equal( 'https://wordpress.com/sharing/example.org' );
			} );

			it( 'has an "external" icon', () => {
				expect( wrapper.find( 'NavItem' ).children().find( 'Gridicon' ) ).to.have.length( 1 );
			} );
		} );

		describe( 'if site is in dev mode', () => {

			before( () => {
				wrapper = shallow( <NavigationSettings { ...testProps } siteConnectionStatus={ false } />, options );
			} );

			it( 'points to WP Admin', () => {
				expect( wrapper.find( 'NavItem' ).nodes.pop().props.path ).to.be.equal( 'https://example.org/wp-admin/options-general.php?page=sharing' );
			} );

			it( 'does not have an icon', () => {
				expect( wrapper.find( 'NavItem' ).children().find( 'Gridicon' ) ).to.have.length( 0 );
			} );
		} );
	} );
} );
