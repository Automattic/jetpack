import { shallow } from 'enzyme';
import React from 'react';
import { Navigation } from '../index';

describe( 'Navigation', () => {
	const testProps = {
		userCanManageModules: false,
		userCanViewStats: false,
		location: {
			pathname: '/dashboard',
		},
		routeName: 'At a Glance',
		isModuleActivated: () => false,
	};
	const wrapper = shallow( <Navigation { ...testProps } /> );

	it( 'renders a div with a className of "dops-navigation"', () => {
		expect( wrapper.find( '.dops-navigation' ) ).toHaveLength( 1 );
	} );

	describe( 'User that can view Stats but not manage modules and Protect is inactive', () => {
		it( 'renders Navigation, SectionNav, NavTabs', () => {
			expect( wrapper.find( 'Navigation' ) ).toBeDefined();
			expect( wrapper.find( 'SectionNav' ) ).toBeDefined();
			expect( wrapper.find( 'NavTabs' ) ).toBeDefined();
		} );

		it( 'renders 2 NavItem components', () => {
			expect( wrapper.find( 'NavItem' ) ).toHaveLength( 1 );
		} );
	} );

	describe( "User can't view Stats or manage modules but Protect is active", () => {
		testProps.isModuleActivated = () => true;

		const wrapperProtect = shallow( <Navigation { ...testProps } /> );

		it( 'renders 1 NavItem components', () => {
			expect( wrapperProtect.find( 'NavItem' ) ).toHaveLength( 1 );
		} );

		it( 'renders tabs with At a Glance', () => {
			expect(
				wrapperProtect
					.find( 'NavItem' )
					.children()
					.map( item => item.text() )
					.join()
			).toBe( 'At a Glance' );
		} );
	} );

	describe( 'User that can manage modules', () => {
		Object.assign( testProps, {
			userCanManageModules: true,
			userCanViewStats: false,
			isModuleActivated: () => false,
		} );

		const wrapperManage = shallow( <Navigation { ...testProps } /> );

		it( 'renders 2 NavItem components', () => {
			expect( wrapperManage.find( 'NavItem' ) ).toHaveLength( 2 );
		} );

		it( 'renders At a Glance and Plans tabs', () => {
			expect(
				wrapperManage
					.find( 'NavItem' )
					.children()
					.map( item => item.text() )
					.join()
			).toBe( 'At a Glance,Plans' );
		} );
	} );
} );
