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
			'photon'
		],
		allGroupsForNonAdmin = [
			'post-by-email'
		];

	let testProps = {
		info: {
			text: 'Help text about Protect',
			link: getRedirectUrl( 'jetpack-support-protect' ),
		},
		isOfflineMode: false,
		isSitePublic: true,
		userCanManageModules: true,
		isLinked: true,
		isUnavailableInOfflineMode: () => false
	};

	const settingsGroup = shallow( <SettingsGroup support={ testProps.info } hasChild /> );

	it( 'outputs a special CSS class when it has the hasChild property', () => {
		expect( settingsGroup.find( 'Card' ).props().className ).to.contain( 'jp-form-has-child' );
	} );

	it( 'the support info icon has an informational tooltip', () => {
		expect( settingsGroup.find( 'SupportInfo' ) ).to.have.length( 1 );
	} );

	it( 'does not have a support info icon if no link or module was passed', () => {
		expect( shallow( <SettingsGroup /> ).find( 'SupportInfo' ) ).to.have.length( 0 );
	} );

	describe( 'has a fading layer', () => {

		it( 'visible in in Offline Mode', () => {
			const disabled = {
				disableInOfflineMode: true,
				isUnavailableInOfflineMode: () => true
			};
			expect( shallow( <SettingsGroup { ...disabled } /> ).find( '.jp-form-block-fade' ) ).to.have.length( 1 );
		} );

		it( 'visible in Post by Email when user is unlinked', () => {
			const disabled = {
				module: {
					module: 'post-by-email'
				},
				isLinked: false
			};
			expect( shallow( <SettingsGroup { ...disabled } /> ).find( '.jp-form-block-fade' ) ).to.have.length( 1 );
		} );

		it( 'not visible in Post by Email when user is linked', () => {
			const disabled = {
				module: {
					module: 'post-by-email'
				},
				isLinked: true
			};
			expect( shallow( <SettingsGroup { ...disabled } /> ).find( '.jp-form-block-fade' ) ).to.have.length( 0 );
		} );

	} );

	describe( 'When user is not an admin', () => {

		Object.assign( testProps, {
			userCanManageModules: false
		} );

		it( 'does not render groups that are not After the Deadline or Post by Email', () => {
			allGroupsNonAdminCantAccess.forEach( item => {
				testProps.module = item;
				expect( shallow( <SettingsGroup module={ testProps } /> ).find( '.jp-form-settings-group' ) ).to.have.length( 0 );
			} );
		} );

		it( 'renders After the Deadline and Post by Email groups', () => {
			allGroupsForNonAdmin.forEach( item => {
				testProps.module = item;
				expect( shallow( <SettingsGroup module={ testProps } /> ).find( '.jp-form-settings-group' ) ).to.have.length( 1 );
			} );
		} );

	} );

} );
