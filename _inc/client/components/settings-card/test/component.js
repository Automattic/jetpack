/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow, render } from 'enzyme';
import sinon from 'sinon';

/**
 * Internal dependencies
 */
import SettingsCard from '../index';

const DummyComponent = React.createClass( {
	render() {
		return null;
	}
} );

describe( 'SettingsCard', () => {
	let testProps,
		wrapper;

	before( () => {
		testProps = {
			hideButton: false,
			isSavingAnyOption: () => false,
			isDirty: () => true,
			header: 'Comments',
			support: ''
		};

		wrapper = shallow( <SettingsCard { ...testProps } /> );
	} );

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
		before( () => {
			Object.assign( testProps, {
				header: 'A custom header',
				support: 'https://jetpack.com/'
			} );

			wrapper = shallow( <SettingsCard { ...testProps } /> );
		} );

		it( 'the header has priority over module.name', () => {
			expect( wrapper.find( 'SectionHeader' ).props().label ).to.be.equal( 'A custom header' );
		} );

	} );

	describe( 'When a custom header or support URL are passed', () => {
		before( () => {
			Object.assign( testProps, {
				isSavingAnyOption: () => true
			} );

			wrapper = shallow( <SettingsCard { ...testProps } /> );
		} );

		it( "when saving, it's disabled", () => {
			expect( wrapper.find( 'Button' ).get(0).props.disabled ).to.be.true;
		} );

	} );

	describe( "If the support attribute and module doesn't have a support link", () => {
		before( () => {
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

			wrapper = shallow( <SettingsCard { ...testProps } /> );
		} );

		it( 'the support icon is not rendered', () => {
			expect( wrapper.find( 'Button' ) ).to.have.length( 1 );
		} );

	} );

	describe( 'When save button is clicked three times', () => {
		let onSave,
			wasSaving;

		before( () => {
			onSave = sinon.spy();
			wasSaving = sinon.spy();

			Object.assign( testProps, {
				onSubmit: onSave,
				isSavingAnyOption: wasSaving
			} );

			const saveButton = shallow( <SettingsCard { ...testProps } /> ).find( 'SectionHeader' ).find( 'Button' );

			saveButton.simulate( 'click' );
			saveButton.simulate( 'click' );
			saveButton.simulate( 'click' );
		} );

		it( 'onSubmit() was triggered once', () => {
			expect( onSave ).to.have.property( 'callCount', 3 );
		} );

		it( 'isSavingAnyOption() is called once', () => {
			expect( wasSaving.calledOnce ).to.be.true;
		} );

	} );

	describe( 'When children return an empty object', () => {
		let card;

		before( () => {
			card = render(
				<SettingsCard { ...testProps }>
					<DummyComponent />
				</SettingsCard>
			);
		} );

		it( 'should return an empty object itself', () => {
			expect( card.html() ).to.equal( '<noscript></noscript>' );
		} );
	} );
} );
