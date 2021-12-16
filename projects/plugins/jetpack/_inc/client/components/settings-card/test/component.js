/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { SettingsCard } from '../index';

describe( 'SettingsCard', () => {

	let testProps = {
		module: 'comments',
		hideButton: false,
		getModule: () => (
			{
				name: 'Comments',
				learn_more_button: getRedirectUrl( 'jetpack-support-protect' )
			}
		),
		isSavingAnyOption: () => false,
		isDirty: () => true,
		header: '',
		support: '',
		sitePlan: {
			product_slug: 'jetpack_free'
		},
		userCanManageModules: true,
		getModuleOverride: () => {
			return false;
		}
	};

	const allCardsNonAdminCantAccess = [
			'widget-visibility',
			'contact-form',
			'sitemaps',
			'latex',
			'carousel',
			'tiled-gallery',
			'custom-content-types',
			'verification-tools',
			'markdown',
			'infinite-scroll',
			'gravatar-hovercards',
			'custom-css',
			'sharedaddy',
			'widgets',
			'shortcodes',
			'related-posts',
			'videopress',
			'monitor',
			'sso',
			'vaultpress',
			'google-analytics',
			'seo-tools',
			'stats',
			'wordads',
			'manage',
			'likes',
			'shortlinks',
			'notes',
			'subscriptions',
			'protect',
			'enhanced-distribution',
			'comments',
			'json-api',
			'photon'
		],
		allCardsForNonAdmin = [
			'post-by-email'
		];

	const wrapper = shallow( <SettingsCard { ...testProps } ><p>Child</p></SettingsCard> );

	it( 'renders a heading', () => {
		expect( wrapper.find( 'SectionHeader' ) ).to.have.length( 1 );
	} );

	it( 'the heading has the right text', () => {
		expect( wrapper.find( 'SectionHeader' ).props().label ).to.be.equal( 'Comments' );
	} );

	it( "when not saving and has settings to save, it's enabled", () => {
		expect( wrapper.find( 'Button' ).get(0).props.disabled ).to.be.false;
	} );

	describe( 'When a custom header or support URL are passed', () => {

		Object.assign( testProps, {
			header: 'A custom header',
			support: getRedirectUrl( 'jetpack' )
		} );

		const wrapper = shallow( <SettingsCard { ...testProps } ><p>Child</p></SettingsCard> );

		it( 'the header has priority over module.name', () => {
			expect( wrapper.find( 'SectionHeader' ).props().label ).to.be.equal( 'A custom header' );
		} );

	} );

	describe( 'When save is disabled', () => {

		Object.assign( testProps, {
			saveDisabled: true
		} );

		const wrapper = shallow( <SettingsCard { ...testProps } ><p>Child</p></SettingsCard> );

		it( "when saving, it's disabled", () => {
			expect( wrapper.find( 'Button' ).get(0).props.disabled ).to.be.true;
		} );

		it( "when saving, button label is updated to Saving…", () => {
			expect( wrapper.find( 'Button' ).get(0).props.children ).to.be.equal( 'Saving…' );
		} );

	} );

	describe( "If the support attribute and module doesn't have a support link", () => {

		Object.assign( testProps, {
			saveDisabled: false,
			support: '',
			getModule: () => (
				{
					name: 'Comments',
					learn_more_button: ''
				}
			)
		} );

		const wrapper = shallow( <SettingsCard { ...testProps } ><p>Child</p></SettingsCard> );

		it( 'the support icon is not rendered', () => {
			expect( wrapper.find( 'Button' ) ).to.have.length( 1 );
		} );

	} );

	describe( 'When save button is clicked three times', () => {

		const onSave = sinon.spy();

		Object.assign( testProps, {
			onSubmit: onSave,
			saveDisabled: true
		} );

		const saveButton = shallow( <SettingsCard { ...testProps } ><p>Child</p></SettingsCard> ).find( 'SectionHeader' ).find( 'Button' );

		saveButton.simulate( 'click' );
		saveButton.simulate( 'click' );
		saveButton.simulate( 'click' );

		it( 'if save is disabled, do not call onSubmit', () => {
			expect( onSave ).to.have.property( 'callCount', 0 );
		} );

	} );

	describe( 'When user is not an admin', () => {

		Object.assign( testProps, {
			userCanManageModules: false
		} );

		it( 'does not render cards that are not Post by Email', () => {
			allCardsNonAdminCantAccess.forEach( item => {
				expect( shallow( <SettingsCard { ...testProps } module={ item } ><p>Child</p></SettingsCard> ).find( 'form' ) ).to.have.length( 0 );
			} );
		} );

		it( 'renders Post by Email cards', () => {
			allCardsForNonAdmin.forEach( item => {
				expect( shallow( <SettingsCard { ...testProps } module={ item } ><p>Child</p></SettingsCard> ).find( 'form' ) ).to.have.length( 1 );
			} );
		} );

	} );

} );
