/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import SearchableSettings from '../index';
import { Writing } from 'writing';
import Traffic from 'traffic';
import { Discussion } from 'discussion';
import { Security } from 'security';

describe( 'SearchableSettings', () => {
	let testProps,
		wrapper;

	before( () => {
		testProps = {
			route: {
				name: 'General',
				path: '/settings'
			},
			searchTerm: false,
			isModuleFound: () => true
		};

		wrapper = shallow( <SearchableSettings { ...testProps } /> );
	} );

	describe( 'initially', () => {
		it( 'renders its initial markup', () => {
			expect( wrapper.find( '.jp-settings-container' ) ).to.have.length( 1 );
			expect( wrapper.find( '.jp-no-results' ) ).to.have.length( 1 );
		} );

		it( 'renders the writing tab', () => {
			expect( wrapper.containsMatchingElement( <Writing /> ) ).to.be.true;
		} );

		it( 'does not render any other tabs', () => {
			expect( wrapper.containsAnyMatchingElements( [
				<Traffic />,
				<Security />,
				<Discussion />
			] ) ).to.be.false;
		} );
	} );

	describe( 'when navigation changes to writing', () => {
		before( () => {
			testProps.route.path = '/writing';
			wrapper = shallow( <SearchableSettings { ...testProps } /> );
		} );

		it( 'renders the writing tab', () => {
			expect( wrapper.containsMatchingElement( <Writing /> ) ).to.be.true;
		} );

		it( 'does not render any other tabs', () => {
			expect( wrapper.containsAnyMatchingElements( [
				<Traffic />,
				<Security />,
				<Discussion />
			] ) ).to.be.false;
		} );
	} );

	describe( 'when navigation changes to traffic', () => {
		before( () => {
			testProps.route.path = '/traffic';
			wrapper = shallow( <SearchableSettings { ...testProps } /> );
		} );

		it( 'renders the traffic tab', () => {
			expect( wrapper.containsMatchingElement( <Traffic /> ) ).to.be.true;
		} );

		it( 'does not render any other tabs', () => {
			expect( wrapper.containsAnyMatchingElements( [
				<Writing />,
				<Security />,
				<Discussion />
			] ) ).to.be.false;
		} );
	} );

	describe( 'when navigation changes to discussion', () => {
		before( () => {
			testProps.route.path = '/discussion';
			wrapper = shallow( <SearchableSettings { ...testProps } /> );
		} );

		it( 'renders the discussion tab', () => {
			expect( wrapper.containsMatchingElement( <Discussion /> ) ).to.be.true;
		} );

		it( 'does not render any other tabs', () => {
			expect( wrapper.containsAnyMatchingElements( [
				<Writing />,
				<Security />,
				<Traffic />
			] ) ).to.be.false;
		} );
	} );

	describe( 'when navigation changes to security', () => {
		before( () => {
			testProps.route.path = '/security';
			wrapper = shallow( <SearchableSettings { ...testProps } /> );
		} );

		it( 'renders the security tab', () => {
			expect( wrapper.containsMatchingElement( <Security /> ) ).to.be.true;
		} );

		it( 'does not render any other tabs', () => {
			expect( wrapper.containsAnyMatchingElements( [
				<Writing />,
				<Discussion />,
				<Traffic />
			] ) ).to.be.false;
		} );
	} );

	describe( 'when navigation changes to search', () => {
		before( () => {
			testProps.route.path = '/search';
			wrapper = shallow( <SearchableSettings { ...testProps } /> );
		} );
		it( 'renders the writing tab', () => {
			expect( wrapper.containsMatchingElement( <Writing /> ) ).to.be.true;
		} );
		it( 'renders the traffic tab', () => {
			expect( wrapper.containsMatchingElement( <Traffic /> ) ).to.be.true;
		} );
		it( 'renders the discussion tab', () => {
			expect( wrapper.containsMatchingElement( <Discussion /> ) ).to.be.true;
		} );
		it( 'renders the security tab', () => {
			expect( wrapper.containsMatchingElement( <Security /> ) ).to.be.true;
		} );
	} );

	
	describe( 'when any of the writing tab modules are found', () => {
		[
			'markdown',
			'after-the-deadline',
			'carousel',
			'photon',
			'custom-content-types',
			'infinite-scroll',
			'minileven',
			'post-by-email'
		].map( ( slug ) => {
			before( () => {
				testProps = {
					...testProps,
					route: {
						name: 'Search',
						path: '/search'
					},
					isModuleFound: ( subject ) => slug === subject
				};

				wrapper = shallow( <SearchableSettings { ...testProps } /> );
			} );

			it( 'renders the writing tab', () => {
				expect( wrapper.containsMatchingElement( <Writing /> ) ).to.be.true;
			} );

			it( 'does not render any other tabs', () => {
				expect( wrapper.containsAnyMatchingElements( [
					<Security />,
					<Discussion />,
					<Traffic />
				] ) ).to.be.false;
			} );
		} );
	} );

	describe( 'when any of the discussion tab modules are found', () => {
		[
			'comments',
			'subscriptions'
		].map( ( slug ) => {
			before( () => {
				testProps = {
					...testProps,
					route: {
						name: 'Search',
						path: '/search'
					},
					isModuleFound: ( subject ) => slug === subject
				};

				wrapper = shallow( <SearchableSettings { ...testProps } /> );
			} );

			it( 'renders the discussion tab', () => {
				expect( wrapper.containsMatchingElement( <Discussion /> ) ).to.be.true;
			} );

			it( 'does not render any other tabs', () => {
				expect( wrapper.containsAnyMatchingElements( [
					<Security />,
					<Writing />,
					<Traffic />
				] ) ).to.be.false;
			} );
		} );
	} );

	describe( 'when any of the security tab modules are found', () => {
		[
			'protect',
			'sso'
		].map( ( slug ) => {
			before( () => {
				testProps = {
					...testProps,
					route: {
						name: 'Search',
						path: '/search'
					},
					isModuleFound: ( subject ) => slug === subject
				};

				wrapper = shallow( <SearchableSettings { ...testProps } /> );
			} );

			it( 'renders the security tab', () => {
				expect( wrapper.containsMatchingElement( <Security /> ) ).to.be.true;
			} );

			it( 'does not render any other tabs', () => {
				expect( wrapper.containsAnyMatchingElements( [
					<Writing />,
					<Discussion />,
					<Traffic />
				] ) ).to.be.false;
			} );
		} );
	} );

	describe( 'when any of the traffic tab modules are found', () => {
		[
			'seo-tools',
			'sitemaps',
			'wordads',
			'stats',
			'related-posts',
			'verification-tools'
		].map( ( slug ) => {
			before( () => {
				testProps = {
					...testProps,
					route: {
						name: 'Search',
						path: '/search'
					},
					isModuleFound: ( subject ) => slug === subject
				};

				wrapper = shallow( <SearchableSettings { ...testProps } /> );
			} );

			it( 'renders the traffic tab', () => {
				expect( wrapper.containsMatchingElement( <Traffic /> ) ).to.be.true;
			} );

			it( 'does not render any other tabs', () => {
				expect( wrapper.containsAnyMatchingElements( [
					<Security />,
					<Discussion />,
					<Writing />
				] ) ).to.be.false;
			} );
		} );
	} );
} );
