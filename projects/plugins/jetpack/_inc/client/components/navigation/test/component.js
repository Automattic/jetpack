import React from 'react';
import { render, screen } from 'test/test-utils';
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

	describe( 'User that can view Stats but not manage modules and Protect is inactive', () => {
		it( 'renders 1 NavItem component', () => {
			render( <Navigation { ...testProps } /> );

			// eslint-disable-next-line jest-dom/prefer-in-document -- No, we really want to assert there's exactly 1.
			expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 1 );
			// eslint-disable-next-line jest-dom/prefer-in-document -- No, we really want to assert there's exactly 1.
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 1 );

			expect( screen.getByRole( 'menuitem', { name: 'At a Glance' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'At a Glance' } ) ).toBeInTheDocument();
		} );
	} );

	describe( "User can't view Stats or manage modules but Protect is active", () => {
		const currentTestProps = {
			...testProps,
			isModuleActivated: () => true,
		};

		it( 'renders 1 NavItem components', () => {
			render( <Navigation { ...currentTestProps } /> );
			// eslint-disable-next-line jest-dom/prefer-in-document -- No, we really want to assert there's exactly 1.
			expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 1 );
			// eslint-disable-next-line jest-dom/prefer-in-document -- No, we really want to assert there's exactly 1.
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 1 );
		} );

		it( 'renders tabs with At a Glance', () => {
			render( <Navigation { ...currentTestProps } /> );
			expect( screen.getByRole( 'menuitem', { name: 'At a Glance' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'At a Glance' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'User that can manage modules', () => {
		const currentTestProps = {
			...testProps,
			userCanManageModules: true,
			userCanViewStats: false,
		};

		it( 'renders 2 NavItem components', () => {
			render( <Navigation { ...currentTestProps } /> );
			expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 2 );
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
		} );

		it( 'renders At a Glance and Plans tabs', () => {
			render( <Navigation { ...currentTestProps } /> );
			expect( screen.getByRole( 'menuitem', { name: 'At a Glance' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'At a Glance' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'menuitem', { name: 'Plans' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Plans' } ) ).toBeInTheDocument();
		} );

		it( 'does not render Plans tab when offline', () => {
			render( <Navigation { ...currentTestProps } isOfflineMode={ true } /> );
			expect( screen.queryByRole( 'menuitem', { name: 'Plans' } ) ).not.toBeInTheDocument();
			expect( screen.queryByRole( 'option', { name: 'Plans' } ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'User that can manage modules, site is linked', () => {
		const currentTestProps = {
			...testProps,
			userCanManageModules: true,
			userCanViewStats: false,
			isLinked: true,
		};

		it( 'renders 3 NavItem components', () => {
			render( <Navigation { ...currentTestProps } /> );
			expect( screen.getAllByRole( 'menuitem' ) ).toHaveLength( 3 );
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 3 );
		} );

		it( 'renders At a Glance, My Plan, and Plans tabs', () => {
			render( <Navigation { ...currentTestProps } /> );
			expect( screen.getByRole( 'menuitem', { name: 'At a Glance' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'At a Glance' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'menuitem', { name: 'My Plan' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'My Plan' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'menuitem', { name: 'Plans' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Plans' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'User that can manage modules, on-request tabs', () => {
		const currentTestProps = {
			...testProps,
			userCanManageModules: true,
			userCanViewStats: false,
		};

		it( 'renders Recommendations tab', () => {
			render(
				<Navigation
					{ ...currentTestProps }
					showRecommendations={ true }
					newRecommendationsCount={ 1 }
				/>
			);
			expect( screen.getByRole( 'menuitem', { name: 'Recommendations 1' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'Recommendations 1' } ) ).toBeInTheDocument();
		} );

		it( 'renders My Jetpack tab', () => {
			render( <Navigation { ...currentTestProps } showMyJetpack={ true } /> );
			expect( screen.getByRole( 'menuitem', { name: 'My Jetpack' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'option', { name: 'My Jetpack' } ) ).toBeInTheDocument();
		} );
	} );
} );
