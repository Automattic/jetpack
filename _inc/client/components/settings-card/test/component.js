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
import { SettingsCard } from '../index';

describe( 'SettingsCard', () => {

	let testProps = {
		hideButton: false,
		module: {
			name: 'Comments',
			learn_more_button: 'https://jetpack.com/support/protect'
		},
		isSavingAnyOption: () => false,
		isDirty: () => true,
		header: '',
		support: '',
		sitePlan: {
			product_slug: 'jetpack_free'
		},
		userCanManageModules: true
	};

	const allCardsNonAdminCantAccess = [
			'widget-visibility',
			'minileven',
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
			'omnisearch',
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
			'composing',
			'post-by-email'
		];

	const wrapper = shallow( <SettingsCard { ...testProps } /> );

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
			support: 'https://jetpack.com/'
		} );

		const wrapper = shallow( <SettingsCard { ...testProps } /> );

		it( 'the header has priority over module.name', () => {
			expect( wrapper.find( 'SectionHeader' ).props().label ).to.be.equal( 'A custom header' );
		} );

	} );

	describe( 'When a custom header or support URL are passed', () => {

		Object.assign( testProps, {
			isSavingAnyOption: () => true
		} );

		const wrapper = shallow( <SettingsCard { ...testProps } /> );

		it( "when saving, it's disabled", () => {
			expect( wrapper.find( 'Button' ).get(0).props.disabled ).to.be.true;
		} );

	} );

	describe( "If the support attribute and module doesn't have a support link", () => {

		Object.assign( testProps, {
			isSavingAnyOption: () => false,
			support: '',
			getModule: () => (
				{
					name: 'Comments',
					learn_more_button: ''
				}
			)
		} );

		const wrapper = shallow( <SettingsCard { ...testProps } /> );

		it( 'the support icon is not rendered', () => {
			expect( wrapper.find( 'Button' ) ).to.have.length( 1 );
		} );

	} );

	describe( 'When save button is clicked three times', () => {

		const onSave = sinon.spy();
		const wasSaving = sinon.spy();

		Object.assign( testProps, {
			onSubmit: onSave,
			isSavingAnyOption: wasSaving
		} );

		const saveButton = shallow( <SettingsCard { ...testProps } /> ).find( 'SectionHeader' ).find( 'Button' );

		saveButton.simulate( 'click' );
		saveButton.simulate( 'click' );
		saveButton.simulate( 'click' );

		it( 'onSubmit() was triggered once', () => {
			expect( onSave ).to.have.property( 'callCount', 3 );
		} );

		it( 'isSavingAnyOption() is called once', () => {
			expect( wasSaving.calledOnce ).to.be.true;
		} );

	} );

	describe( 'When user is not an admin', () => {

		Object.assign( testProps, {
			userCanManageModules: false
		} );

		it( 'does not render cards that are not Composing or Post by Email', () => {
			allCardsNonAdminCantAccess.forEach( item => {
				expect( shallow( <SettingsCard { ...testProps } module={ item } /> ).find( 'form' ) ).to.have.length( 0 );
			} );
		} );

		it( 'renders Composing and Post by Email cards', () => {
			allCardsForNonAdmin.forEach( item => {
				expect( shallow( <SettingsCard { ...testProps } module={ item } /> ).find( 'form' ) ).to.have.length( 1 );
			} );
		} );

	} );

} );
