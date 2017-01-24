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
import { SettingsCard, SettingsGroup } from '../index';

describe( 'SettingsCard', () => {

	let testProps = {
		module: 'comments',
		hideButton: false,
		getModule: () => (
			{
				name: 'Comments',
				learn_more_button: 'https://jetpack.com/support/protect'
			}
		),
		isSavingAnyOption: () => false,
		isDirty: () => true,
		header: '',
		support: ''
	};

	const wrapper = shallow( <SettingsCard { ...testProps } /> ),
		  settingsGroup = shallow( <SettingsGroup support={ testProps.getModule().learn_more_button } /> );

	it( 'renders a heading', () => {
		expect( wrapper.find( 'SectionHeader' ) ).to.have.length( 1 );
	} );

	it( 'the heading has the right text', () => {
		expect( wrapper.find( 'SectionHeader' ).props().label ).to.be.equal( 'Comments' );
	} );

	it( 'the learn more icon is linked to the correct URL', () => {
		expect( settingsGroup.find( 'Button' ).get(0).props.href ).to.be.equal( 'https://jetpack.com/support/protect' );
	} );

	it( "when not saving and has settings to save, it's enabled", () => {
		expect( wrapper.find( 'Button' ).get(0).props.disabled ).to.be.false;
	} );

	describe( 'When a custom header or support URL are passed', () => {

		Object.assign( testProps, {
			header: 'A custom header',
			support: 'https://jetpack.com/'
		} );

		const wrapper = shallow( <SettingsCard { ...testProps } /> ),
			  settingsGroup = shallow( <SettingsGroup support={ testProps.support } /> );

		it( 'the header has priority over module.name', () => {
			expect( wrapper.find( 'SectionHeader' ).props().label ).to.be.equal( 'A custom header' );
		} );

		it( 'the learn more icon will be linked to the custom URL', () => {
			expect( settingsGroup.find( 'Button' ).get(0).props.href ).to.be.equal( 'https://jetpack.com/' );
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

} );
