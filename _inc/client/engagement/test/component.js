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
import { Engagement } from '../index';

describe( 'Engagement', () => {

	let testProps = {
		toggleModule: () => true,
		isModuleActivated: () => false,
		isTogglingModule:  () => false,
		getModule: () => {
			return {
				'name': 'SEO Tools',
				'description': 'Better results on search engines and social media.',
				'learn_more_button': 'https://jetpack.com/support/seo-tools/'
			}
		},
		isUnavailableInDevMode: () => false,
		siteAdminUrl: 'https://example.org/wp-admin/',
		siteRawUrl: 'https://example.org/',
		isSitePublic: true,
		sitePlan: {
			'product_slug': 'jetpack_premium'
		},
		userCanManageModules: true,
		moduleList: {
			'seo-tools': {
				activated                : false,
				additional_search_queries: 'search engine optimization, social preview, meta description, custom title format',
				auto_activate            : 'No',
				available                : true,
				changed                  : '',
				configurable             : false,
				configure_url            : 'https://example.org/wp-admin/admin.php?page=jetpack&configure=seo-tools',
				deactivate               : true,
				description              : 'Better results on search engines and social media.',
				feature                  : ['Traffic', 'Jumpstart'],
				free                     : true,
				introduced               : '4.4',
				jumpstart_desc           : 'Better results on search engines and social media.',
				learn_more_button        : 'https://jetpack.com/support/seo-tools/',
				long_description         : 'Better results on search engines and social media.',
				module                   : 'seo-tools',
				module_tags              : ['Social', 'Appearance'],
				name                     : 'SEO Tools',
				options                  : [],
				recommendation_order     : 15,
				requires_connection      : true,
				search_terms             : 'search engine optimization, social preview, meta description, custom title format',
				short_description        : 'Better results on search engines and social media.',
				sort                     : 35
			}
		}
	};

	describe( 'Initially', () => {

		const wrapper = shallow( <Engagement { ...testProps } /> );

		it( 'renders a card for SEO Tools', () => {
			expect( wrapper.find( 'FoldableCard' ) ).to.have.length( 1 );
			expect( wrapper.find( 'FoldableCard' ).props().header.props.children[0] ).to.have.string( testProps.getModule().name );
		} );

		it( "SEO Tools is not available in 'jetpack_premium' plan", () => {
			expect( wrapper.find( 'FoldableCard' ).props().summary.type.displayName ).to.be.not.equal( 'ModuleToggle' );
		} );

	} );

	describe( 'if polling site plan from wpcom', () => {

		testProps = Object.assign( testProps, {
			sitePlan: {
				product_slug: undefined
			}
		} );

		const wrapper = shallow( <Engagement { ...testProps } /> );

		it( "don't display the toggle", () => {
			expect( wrapper.find( 'FoldableCard' ).props().summary.type.displayName ).to.not.equal( 'ModuleToggle' );
		} );

	} );

	describe( "if site has 'jetpack_business' plan", () => {

		testProps = Object.assign( testProps, {
			sitePlan: {
				'product_slug': 'jetpack_business'
			}
		} );

		const wrapper = shallow( <Engagement { ...testProps } /> );
		let cardProps = wrapper.find( 'FoldableCard' ).props();

		it( "SEO Tools is available in 'jetpack_business' plan", () => {
			expect( cardProps.summary.type.displayName ).to.be.equal( 'ModuleToggle' );
		} );

		it( 'always displays a PRO badge next to the title', () => {
			expect( cardProps.header.props.children[1].type.displayName ).to.be.equal( 'Button' );
		} );

		it( 'the PRO badge points to the Plans tab', () => {
			expect( cardProps.header.props.children[1].props.href ).to.have.string( '#/plans' );
		} );

	} );

} );

