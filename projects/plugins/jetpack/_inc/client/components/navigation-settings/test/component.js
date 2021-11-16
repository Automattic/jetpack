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
	let wrapper, testProps;

	before( () => {
		testProps = {
			hasAnyOfTheseModules: () => true,
			hasAnyPerformanceFeature: true,
			hasAnySecurityFeature: true,
			userCanManageModules: false,
			isSubscriber: true,
			location: {
				pathname: '/settings',
			},
			routeName: 'General',
			history: {
				listen: () => {},
			},
			isModuleActivated: () => true,
			isSiteConnected: true,
			siteRawUrl: 'example.org',
			siteAdminUrl: 'https://example.org/wp-admin/',
			searchForTerm: () => {},
			isLinked: true,
			moduleList: {
				sitemaps: true,
				carousel: true,
				'custom-content-types': true,
				'verification-tools': true,
				markdown: true,
				'infinite-scroll': true,
				'gravatar-hovercards': true,
				sharedaddy: true,
				sso: true,
				'related-posts': true,
				monitor: true,
				vaultpress: true,
				stats: true,
				masterbar: true,
				'google-analytics': true,
				'seo-tools': true,
				wordads: true,
				videopress: true,
				subscriptions: true,
				comments: true,
				'post-by-email': true,
				photon: true,
				publicize: true,
				likes: true,
			},
			isPluginActive: () => true,
		};

		window.location.hash = '#settings';
		wrapper = shallow( <NavigationSettings { ...testProps } /> );
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
				isSubscriber: false,
			} );

			wrapper = shallow( <NavigationSettings { ...testProps } /> );
		} );

		it( 'renders tabs with Writing and Sharing', () => {
			expect(
				wrapper
					.find( 'NavItem' )
					.children()
					.getElements()
					.filter( item => 'string' === typeof item )
					.every( item => [ 'Writing', 'Sharing' ].includes( item ) )
			).to.be.true;
		} );

		it( 'show only Writing if Publicize is disabled', () => {
			const publicizeProps = Object.assign( {}, testProps, {
				userCanManageModules: false,
				isSubscriber: false,
				userCanPublish: true,
				isModuleActivated: m => 'sharedaddy' === m,
			} );
			expect(
				shallow( <NavigationSettings { ...publicizeProps } /> )
					.find( 'NavItem' )
					.children()
					.getElements()
					.filter( item => 'string' === typeof item )
					.every( item => [ 'Writing' ].includes( item ) )
			).to.be.true;
		} );

		it( 'show only Sharing if Post By Email is disabled', () => {
			const pbeProps = Object.assign( {}, testProps, {
				userCanManageModules: false,
				isSubscriber: false,
				userCanPublish: true,
				isModuleActivated: m => 'post-by-email' === m,
			} );
			expect(
				shallow( <NavigationSettings { ...pbeProps } /> )
					.find( 'NavItem' )
					.children()
					.getElements()
					.filter( item => 'string' === typeof item )
					.every( item => [ 'Sharing' ].includes( item ) )
			).to.be.true;
		} );

		it( 'has /sharing as selected navigation item, accessing through /settings, even when both PBE and Publicize are active', () => {
			const allActivatedProps = Object.assign( {}, testProps, {
				userCanManageModules: false,
				isSubscriber: false,
				userCanPublish: true,
				isModuleActivated: m => true,
			} );
			expect(
				shallow( <NavigationSettings { ...allActivatedProps } /> )
					.find( 'NavItem' )
					.get( 1 ).props.selected
			).to.be.true;
			expect(
				shallow( <NavigationSettings { ...allActivatedProps } /> )
					.find( 'NavItem' )
					.get( 1 ).props.path
			).to.equal( '#sharing' );
		} );

		it( 'does not display Search', () => {
			expect( wrapper.find( 'Search' ) ).to.have.length( 0 );
		} );

		it( 'do not show Sharing to contributors', () => {
			const publicizeProps = Object.assign( {}, testProps, {
				userCanManageModules: false,
				isSubscriber: false,
				isContributor: true,
				isModuleActivated: m => 'sharedaddy' === m,
			} );
			expect(
				shallow( <NavigationSettings { ...publicizeProps } /> )
					.find( 'NavItem' )
					.children()
					.getElements()
					.filter( item => 'string' === typeof item )
					.every( item => [ 'Writing' ].includes( item ) )
			).to.be.true;
		} );

		describe( 'if Publicize is active', () => {
			before( () => {
				let publicizeProps = Object.assign( {}, testProps, {
					userCanManageModules: false,
					isSubscriber: false,
					userCanPublish: true,
					location: {
						pathname: '/settings',
					},
					routeName: 'General',
					isModuleActivated: m => 'publicize' === m,
				} );
				it( 'show Sharing if user is linked', () => {
					expect(
						shallow( <NavigationSettings { ...publicizeProps } /> )
							.find( 'NavItem' )
							.children()
							.getElements()
							.filter( item => 'string' === typeof item )
							.every( item => [ 'Writing', 'Sharing' ].includes( item ) )
					).to.be.true;
				} );
			} );
		} );
	} );

	describe( 'for an Admin user', () => {
		before( () => {
			Object.assign( testProps, {
				userCanManageModules: true,
				isSubscriber: false,
			} );

			wrapper = shallow( <NavigationSettings { ...testProps } /> );
		} );

		it( 'renders tabs with Discussion, Security, Traffic, Writing, Sharing', () => {
			expect(
				wrapper
					.find( 'NavItem' )
					.children()
					.getElements()
					.filter( item => 'string' === typeof item )
					.every( item =>
						[ 'Writing', 'Discussion', 'Traffic', 'Security', 'Sharing' ].includes( item )
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
					instance.doSearch( 'search-term' );
					expect( window.location.hash ).to.be.equal( '#settings?term=search-term' );
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
				location: {
					pathname: '/security',
				},
				routeName: 'Security',
			} );
			wrapper = shallow( <NavigationSettings { ...testProps } /> );
			expect( wrapper.find( 'SectionNav' ).props().selectedText ).to.be.equal( 'Security' );
		} );
	} );
} );
