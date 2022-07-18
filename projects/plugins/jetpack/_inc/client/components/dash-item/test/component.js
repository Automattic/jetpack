import { getRedirectUrl } from '@automattic/jetpack-components';
import React from 'react';
import { render, screen } from 'test/test-utils';
import { DashItem } from '../index';
import { buildInitialState } from './fixtures';

// Mock components that do fetches in the background. We supply needed state directly.
jest.mock( 'components/data/query-akismet-key-check', () => ( {
	__esModule: true,
	default: () => 'query-akismet-key-check',
} ) );
jest.mock( 'components/data/query-site-plugins', () => ( {
	__esModule: true,
	default: () => 'query-site-plugins',
} ) );
jest.mock( 'components/data/query-vaultpress-data', () => ( {
	__esModule: true,
	default: () => 'query-vaultpress-data',
} ) );

// Mock these for "testing".
jest.mock( 'pro-status', () => ( {
	__esModule: true,
	default: props => {
		return (
			<div
				data-testid="ProStatus"
				data-pro-feature={ props.proFeature }
				data-site-admin-url={ props.siteAdminUrl }
			></div>
		);
	},
} ) );
jest.mock( 'components/module-toggle', () => ( {
	__esModule: true,
	ModuleToggle: props => {
		return <div data-testid="ModuleToggle" data-slug={ props.slug }></div>;
	},
} ) );

describe( 'DashItem', () => {
	const testProps = {
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

	it( 'has the right label for header', () => {
		const { container } = render( <DashItem { ...testProps } />, {
			initialState: buildInitialState(),
		} );
		// eslint-disable-next-line testing-library/no-container
		const node = container.querySelector( '.dops-section-header' );
		expect( node ).toBeInTheDocument();
		expect( node ).toHaveTextContent( 'Protect' );
	} );

	it( 'the card body is built and has its href property correctly set', () => {
		render( <DashItem { ...testProps }>???</DashItem>, { initialState: buildInitialState() } );
		expect( screen.getByRole( 'link', { name: '???' } ) ).toHaveAttribute( 'href', testProps.href );
	} );

	it( 'the top component has classes properly set when is disabled', () => {
		const { container } = render( <DashItem { ...testProps } />, {
			initialState: buildInitialState(),
		} );
		// eslint-disable-next-line testing-library/no-container
		const node = container.querySelector( '.jp-dash-item' );
		expect( node ).toBeInTheDocument();
		expect( node ).toHaveClass( 'jp-dash-item__disabled' );
	} );

	describe( 'when site is connected, is a PRO module, user can toggle', () => {
		// While the button is passed to <SectionHeader>, that doesn't render it.
		it.skip( 'displays a PRO button for a PRO feature', () => {
			render( <DashItem { ...testProps } />, { initialState: buildInitialState() } );
			expect( screen.getByRole( 'link', { name: 'Paid' } ) ).toBeInTheDocument();
		} );

		// Same.
		it.skip( 'the button for a PRO feature is linked to #/plans', () => {
			render( <DashItem { ...testProps } />, { initialState: buildInitialState() } );
			expect( screen.getByRole( 'link', { name: 'Paid' } ) ).toHaveAttribute( 'href', '#/plans' );
		} );

		it( 'does not display a toggle', () => {
			render( <DashItem { ...testProps } />, { initialState: buildInitialState() } );
			expect( screen.queryByTestId( 'ModuleToggle' ) ).not.toBeInTheDocument();
		} );

		it( 'displays the status', () => {
			render( <DashItem { ...testProps } />, { initialState: buildInitialState() } );
			expect( screen.getByTestId( 'ProStatus' ) ).toBeInTheDocument();
		} );

		it( 'the badge references the module', () => {
			render( <DashItem { ...testProps } />, { initialState: buildInitialState() } );
			expect( screen.getByTestId( 'ProStatus' ) ).toHaveAttribute( 'data-pro-feature', 'protect' );
		} );

		it( 'the admin URL is correct', () => {
			render( <DashItem { ...testProps } />, { initialState: buildInitialState() } );
			expect( screen.getByTestId( 'ProStatus' ) ).toHaveAttribute(
				'data-site-admin-url',
				testProps.siteAdminUrl
			);
		} );
	} );

	describe( 'when site is connected, is a PRO module, user can not toggle', () => {
		it( 'displays a toggle for users that can toggle', () => {
			render( <DashItem { ...testProps } userCanToggle={ false } />, {
				initialState: buildInitialState(),
			} );
			expect( screen.queryByTestId( 'ModuleToggle' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'when site is connected, not a PRO module, user can toggle', () => {
		it( 'displays a toggle for users that can toggle', () => {
			render( <DashItem { ...testProps } pro={ false } />, { initialState: buildInitialState() } );
			expect( screen.getByTestId( 'ModuleToggle' ) ).toBeInTheDocument();
		} );

		it( 'the toggle references the module this card belongs to', () => {
			render( <DashItem { ...testProps } pro={ false } />, { initialState: buildInitialState() } );
			expect( screen.getByTestId( 'ModuleToggle' ) ).toHaveAttribute( 'data-slug', 'protect' );
		} );
	} );

	describe( 'when site is connected, not a PRO module, user can not toggle', () => {
		it( 'if user can not toggle, it does not display a toggle', () => {
			render( <DashItem { ...testProps } pro={ false } userCanToggle={ false } />, {
				initialState: buildInitialState(),
			} );
			expect( screen.queryByTestId( 'ModuleToggle' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'when site is connected and user can toggle, the Monitor dash item', () => {
		it( 'has a toggle', () => {
			render( <DashItem { ...testProps } pro={ false } />, { initialState: buildInitialState() } );
			expect( screen.getByTestId( 'ModuleToggle' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'when site is in Offline Mode, not a PRO module, user can not toggle', () => {
		it( 'does not display the PRO button linked to #/plans when site is in Offline Mode', () => {
			render( <DashItem { ...testProps } pro={ false } isOfflineMode={ true } />, {
				initialState: buildInitialState(),
			} );
			expect( screen.queryByRole( 'link', { name: 'Paid' } ) ).not.toBeInTheDocument();
		} );

		it( 'does not display a toggle', () => {
			render( <DashItem { ...testProps } pro={ false } isOfflineMode={ true } />, {
				initialState: buildInitialState(),
			} );
			expect( screen.queryByTestId( 'ModuleToggle' ) ).not.toBeInTheDocument();
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

		it( "shows a warning badge when status is 'is-warning'", () => {
			const { container } = render( <DashItem { ...manageProps } />, {
				initialState: buildInitialState(),
			} );
			// eslint-disable-next-line testing-library/no-container
			expect( container.querySelector( '.dops-notice.is-warning' ) ).toBeInTheDocument();
		} );

		it( 'when it is activated, the warning badge is linked to Plugins screen in WordPress.com', () => {
			const { container } = render( <DashItem { ...manageProps } />, {
				initialState: buildInitialState(),
			} );
			// eslint-disable-next-line testing-library/no-container
			const node = container.querySelector( '.dops-notice.is-warning' ).closest( 'a' );
			expect( node ).toBeInTheDocument();
			expect( node ).toHaveAttribute(
				'href',
				getRedirectUrl( 'calypso-plugins-manage', { site: manageProps.siteRawUrl } )
			);
		} );

		it( "when status is 'is-working', the warning badge has an 'active' label", () => {
			const { container } = render( <DashItem { ...manageProps } status="is-working" />, {
				initialState: buildInitialState(),
			} );
			// eslint-disable-next-line testing-library/no-container
			expect( container.querySelector( '.jp-dash-item__active-label' ) ).toBeInTheDocument();
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

		it( 'displays a toggle for users that can toggle', () => {
			render( <DashItem { ...monitorProps } />, { initialState: buildInitialState() } );
			expect( screen.getByTestId( 'ModuleToggle' ) ).toBeInTheDocument();
		} );

		it( 'the toggle references the module this card belongs to', () => {
			render( <DashItem { ...monitorProps } />, { initialState: buildInitialState() } );
			expect( screen.getByTestId( 'ModuleToggle' ) ).toHaveAttribute( 'data-slug', 'monitor' );
		} );
	} );
} );
