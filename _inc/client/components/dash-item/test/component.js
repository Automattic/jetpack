/**
 * External dependencies
 */
import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { DashItem } from '../index';

describe( 'DashItem', () => {

	let testProps = {
		label: 'Testing',
		status: '',
		statusText: '',
		disabled: true,
		module: 'testing',
		pro: true,
		isDevMode: false,
		href: 'https://jetpack.com/',
		userCanToggle: true,
		isModuleActivated: () => true,
		isTogglingModule: () => true
	};

	const wrapper = shallow( <DashItem { ...testProps } /> );

	it( 'has the right label for header', () => {
		expect( wrapper.find( 'SectionHeader' ) ).to.have.length( 1 );
		expect( wrapper.find( 'SectionHeader' ).props().label ).to.be.equal( 'Testing' );
	} );

	it( 'the card body is built and has its href property correctly set', () => {
		expect( wrapper.find( 'Card' ) ).to.have.length( 1 );
		expect( wrapper.find( '.jp-dash-item__card' ).props().href ).to.be.equal( 'https://jetpack.com/' );
	} );

	it( 'the top component has classes properly set when is disabled', () => {
		let classes = wrapper.find( '.jp-dash-item' ).props().className;
		expect( classes ).to.have.string( 'jp-dash-item' );
		expect( classes ).to.have.string( 'jp-dash-item__disabled' );
	} );

	describe( 'when site is connected', () => {

		it( 'displays a PRO button for a PRO feature', () => {
			expect( wrapper.find( 'SectionHeader' ).props().cardBadge.type.displayName ).to.be.equal( 'Button' );
		} );

		it( 'the button for a PRO feature is linked to #/plans', () => {
			expect( wrapper.find( 'SectionHeader' ).props().cardBadge.props.href ).to.be.equal( '#/plans' );
		} );

		it( 'displays a toggle for users that can toggle', () => {
			expect( wrapper.find( 'ModuleToggle' ) ).to.have.length( 1 );
		} );

	} );

	describe( 'when site is in Dev Mode', () => {

		testProps = Object.keys( {
			isDevMode: true
		} );

		const wrapper = shallow( <DashItem { ...testProps } /> );

		it( 'does not display the PRO button linked to #/plans when site is in Dev Mode', () => {
			expect( wrapper.find( 'SectionHeader' ).props().cardBadge ).to.have.length( 0 );
		} );

	} );

} );