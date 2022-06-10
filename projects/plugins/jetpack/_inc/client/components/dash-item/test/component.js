import { getRedirectUrl } from '@automattic/jetpack-components';
import { shallow } from 'enzyme';
import React from 'react';
import { DashItem } from '../index';

describe( 'DashItem', () => {
	let testProps = {
		label: 'Protect',
		module: 'protect',
		status: '',
		statusText: '',
		disabled: true,
		pro: true,
		isOfflineMode: false,
		href: getRedirectUrl( 'jetpack' ),
		userCanToggle: true,
		siteAdminUrl: 'https://example.org/wp-admin/',
		siteRawUrl: 'example.org',
		getOptionValue: () => true,
		isUpdating: () => false,
	};

	const wrapper = shallow( <DashItem { ...testProps } /> );

	it( 'has the right label for header', () => {
		expect( wrapper.find( 'SectionHeader' ) ).toHaveLength( 1 );
		expect( wrapper.find( 'SectionHeader' ).props().label ).toBe( 'Protect' );
	} );

	it( 'the card body is built and has its href property correctly set', () => {
		expect( wrapper.find( 'Card' ) ).toHaveLength( 1 );
	} );

	it( 'the href property for the card body is correctly set', () => {
		expect( wrapper.find( '.jp-dash-item__card' ).props().href ).toEqual(
			getRedirectUrl( 'jetpack' )
		);
	} );

	it( 'the top component has classes properly set when is disabled', () => {
		const classes = wrapper.find( '.jp-dash-item' ).props().className;
		expect( classes ).toContain( 'jp-dash-item' );
		expect( classes ).toContain( 'jp-dash-item__disabled' );
	} );

	describe( 'when site is connected, is a PRO module, user can toggle', () => {
		it( 'displays a PRO button for a PRO feature', () => {
			expect( wrapper.find( 'SectionHeader' ).props().cardBadge.type.displayName ).toBe( 'Button' );
		} );

		it( 'the button for a PRO feature is linked to #/plans', () => {
			expect( wrapper.find( 'SectionHeader' ).props().cardBadge.props.href ).toBe( '#/plans' );
		} );

		it( 'does not display a toggle', () => {
			expect( wrapper.find( 'Connect(ModuleToggle)' ) ).toHaveLength( 0 );
		} );

		const proStatus = wrapper.find( 'Connect(ProStatus)' );
		it( 'displays the status', () => {
			expect( proStatus ).toHaveLength( 1 );
		} );

		it( 'the badge references the module', () => {
			expect( proStatus.props().proFeature ).toBe( 'protect' );
		} );

		it( 'the admin URL is correct', () => {
			expect( proStatus.props().siteAdminUrl ).toEqual( testProps.siteAdminUrl );
		} );
	} );

	describe( 'when site is connected, is a PRO module, user can not toggle', () => {
		testProps = Object.assign( testProps, {
			userCanToggle: false,
		} );

		const wrapper2 = shallow( <DashItem { ...testProps } /> );

		it( 'displays a toggle for users that can toggle', () => {
			expect( wrapper2.find( 'Connect(ModuleToggle)' ) ).toHaveLength( 0 );
		} );
	} );

	describe( 'when site is connected, not a PRO module, user can toggle', () => {
		testProps = Object.assign( testProps, {
			pro: false,
			userCanToggle: true,
		} );

		const wrapper2 = shallow( <DashItem { ...testProps } /> );

		it( 'displays a toggle for users that can toggle', () => {
			expect( wrapper2.find( 'Connect(ModuleToggle)' ) ).toHaveLength( 1 );
		} );

		it( 'the toggle references the module this card belongs to', () => {
			expect( wrapper2.find( 'Connect(ModuleToggle)' ).props().slug ).toBe( 'protect' );
		} );
	} );

	describe( 'when site is connected, not a PRO module, user can not toggle', () => {
		testProps = Object.assign( testProps, {
			userCanToggle: false,
		} );

		const wrapper2 = shallow( <DashItem { ...testProps } /> );

		it( 'if user can not toggle, it does not display a toggle', () => {
			expect( wrapper2.find( 'Connect(ModuleToggle)' ) ).toHaveLength( 0 );
		} );
	} );

	describe( 'when site is connected and user can toggle, the Monitor dash item', () => {
		testProps = Object.assign( testProps, {
			userCanToggle: true,
		} );

		const wrapper2 = shallow( <DashItem { ...testProps } /> );

		it( 'has a toggle', () => {
			expect( wrapper2.find( 'Connect(ModuleToggle)' ) ).toHaveLength( 1 );
		} );
	} );

	describe( 'when site is in Offline Mode, not a PRO module, user can not toggle', () => {
		testProps = Object.assign( testProps, {
			isOfflineMode: true,
		} );

		const wrapper2 = shallow( <DashItem { ...testProps } /> );

		it( 'does not display the PRO button linked to #/plans when site is in Offline Mode', () => {
			expect( wrapper2.find( 'SectionHeader' ).props().cardBadge ).toHaveLength( 0 );
		} );

		it( 'does not display a toggle', () => {
			expect( wrapper2.find( 'Connect(ModuleToggle)' ) ).toHaveLength( 0 );
		} );
	} );

	describe( 'if this is the DashItem for Manage module', () => {
		const manageProps = {
			label: 'Manage',
			module: 'manage',
			status: 'is-warning',
			pro: false,
			isOfflineMode: false,
			userCanToggle: true,
			siteAdminUrl: 'https://example.org/wp-admin/',
			siteRawUrl: 'example.org',
			getOptionValue: () => true,
			isUpdating: () => false,
		};

		const wrapper2 = shallow( <DashItem { ...manageProps } /> );

		it( "shows a warning badge when status is 'is-warning'", () => {
			expect( wrapper2.find( 'SimpleNotice' ) ).toHaveLength( 1 );
		} );

		it( 'when it is activated, the warning badge is linked to Plugins screen in WordPress.com', () => {
			expect( wrapper2.find( 'SectionHeader' ).find( 'a' ).props().href ).toEqual(
				getRedirectUrl( 'calypso-plugins-manage', { site: manageProps.siteRawUrl } )
			);
		} );

		it( "when status is 'is-working', the warning badge has an 'active' label", () => {
			expect(
				shallow( <DashItem { ...manageProps } status="is-working" /> )
					.find( 'SectionHeader' )
					.find( '.jp-dash-item__active-label' )
			).toHaveLength( 1 );
		} );
	} );

	describe( 'if this is the DashItem for Monitor module', () => {
		const monitorProps = {
			module: 'monitor',
			label: 'Monitor',
			status: '',
			pro: false,
			isOfflineMode: false,
			userCanToggle: true,
			siteAdminUrl: 'https://example.org/wp-admin/',
			siteRawUrl: 'example.org',
			getOptionValue: () => true,
			isUpdating: () => false,
		};

		const wrapper2 = shallow( <DashItem { ...monitorProps } /> );

		it( 'displays a toggle for users that can toggle', () => {
			expect( wrapper2.find( 'Connect(ModuleToggle)' ) ).toHaveLength( 1 );
		} );

		it( 'the toggle references the module this card belongs to', () => {
			expect( wrapper2.find( 'Connect(ModuleToggle)' ).props().slug ).toBe( 'monitor' );
		} );
	} );
} );
