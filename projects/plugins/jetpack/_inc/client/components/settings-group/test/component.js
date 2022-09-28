import { getRedirectUrl } from '@automattic/jetpack-components';
import React from 'react';
import { render, screen, within } from 'test/test-utils';
import { SettingsGroup } from '../index';

describe( 'SettingsGroup', () => {
	const allGroupsNonAdminCantAccess = [
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
			'photon',
		],
		allGroupsForNonAdmin = [ 'post-by-email', 'publicize' ];

	const testProps = {
		info: {
			text: 'Help text about Protect',
			link: getRedirectUrl( 'jetpack-support-protect' ),
		},
		isOfflineMode: false,
		isSitePublic: true,
		userCanManageModules: true,
		isLinked: true,
		isUnavailableInOfflineMode: () => false,
	};

	it( 'outputs a special CSS class when it has the hasChild property', () => {
		const { container } = render( <SettingsGroup support={ testProps.info } hasChild /> );
		// eslint-disable-next-line testing-library/no-container
		expect( container.querySelector( '.dops-card' ) ).toHaveClass( 'jp-form-has-child' );
	} );

	it( 'the support info icon has an informational tooltip', () => {
		render( <SettingsGroup support={ testProps.info } hasChild /> );
		const button = screen.getByRole( 'button', { name: 'Learn more' } );
		const node = within( button ).getByText( 'Learn more' );
		expect( node ).toBeInTheDocument();
		expect( node ).toHaveClass( 'screen-reader-text' );
	} );

	it( 'does not have a support info icon if no link or module was passed', () => {
		render( <SettingsGroup /> );
		expect( screen.queryByRole( 'button', { name: 'Learn more' } ) ).not.toBeInTheDocument();
	} );

	describe( 'has a fading layer', () => {
		it( 'visible in in Offline Mode', () => {
			const disabled = {
				disableInOfflineMode: true,
				isUnavailableInOfflineMode: () => true,
			};
			const { container } = render( <SettingsGroup { ...disabled } /> );
			// eslint-disable-next-line testing-library/no-container
			expect( container.querySelector( '.jp-form-block-fade' ) ).toBeInTheDocument();
		} );

		it( 'visible in Post by Email when user is unlinked', () => {
			const disabled = {
				module: {
					module: 'post-by-email',
				},
				isLinked: false,
			};
			const { container } = render( <SettingsGroup { ...disabled } /> );
			// eslint-disable-next-line testing-library/no-container
			expect( container.querySelector( '.jp-form-block-fade' ) ).toBeInTheDocument();
		} );

		it( 'not visible in Post by Email when user is linked', () => {
			const disabled = {
				module: {
					module: 'post-by-email',
				},
				isLinked: true,
			};
			const { container } = render( <SettingsGroup { ...disabled } /> );
			// eslint-disable-next-line testing-library/no-container
			expect( container.querySelector( '.jp-form-block-fade' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'When user is not an admin', () => {
		it.each( allGroupsNonAdminCantAccess )( 'does not render %s group', item => {
			const props = {
				...testProps,
				userCanManageModules: false,
				module: item,
			};
			const { container } = render( <SettingsGroup module={ props } /> );
			// eslint-disable-next-line testing-library/no-container
			expect( container.querySelector( '.jp-form-settings-group' ) ).not.toBeInTheDocument();
		} );

		it.each( allGroupsForNonAdmin )( 'renders %s group', item => {
			const props = {
				...testProps,
				userCanManageModules: false,
				module: item,
			};
			const { container } = render( <SettingsGroup module={ props } /> );
			// eslint-disable-next-line testing-library/no-container
			expect( container.querySelector( '.jp-form-settings-group' ) ).toBeInTheDocument();
		} );
	} );
} );
