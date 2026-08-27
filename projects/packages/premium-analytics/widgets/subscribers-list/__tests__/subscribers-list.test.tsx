/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import SubscribersListWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

// `url` is the subscriber's own site, which is what the row used to link to.
const FOLLOWERS_RESPONSE = {
	total: 1,
	subscribers: [
		{
			label: 'Ada Lovelace',
			avatar: 'https://gravatar.com/avatar/ada',
			url: 'http://ada.wordpress.com',
			date_subscribed: '2026-08-01T00:00:00+00:00',
			subscription_id: 4242,
		},
	],
};

// Restore rather than delete: the suite may share a module registry with
// others that rely on whatever script data was already on the window.
const originalScriptData = window.JetpackScriptData;

function setSiteData( host: string, suffix?: string ) {
	window.JetpackScriptData = { site: { host, suffix } } as never;
}

describe( 'SubscribersListWidget', () => {
	beforeEach( () => {
		// The data package's query client is a module-level singleton; drop its
		// cache so each test starts from a fresh fetch.
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( FOLLOWERS_RESPONSE );
	} );

	afterEach( () => {
		window.JetpackScriptData = originalScriptData;
	} );

	it( 'links the name to the subscriber details page on WordPress.com', async () => {
		setSiteData( 'wpcom', 'example.wordpress.com' );

		render( <SubscribersListWidget attributes={ {} } /> );

		await expect( screen.findByRole( 'link', { name: /Ada Lovelace/ } ) ).resolves.toHaveAttribute(
			'href',
			'https://wordpress.com/subscribers/example.wordpress.com/4242'
		);
	} );

	it( 'links the name to Jetpack Cloud when the site is not Simple', async () => {
		setSiteData( 'woa', 'example.com' );

		render( <SubscribersListWidget attributes={ {} } /> );

		await expect( screen.findByRole( 'link', { name: /Ada Lovelace/ } ) ).resolves.toHaveAttribute(
			'href',
			'https://cloud.jetpack.com/subscribers/example.com/4242'
		);
	} );

	it( 'renders the name as plain text when there is no details page to link to', async () => {
		setSiteData( 'wpcom' );

		render( <SubscribersListWidget attributes={ {} } /> );

		await expect( screen.findByText( 'Ada Lovelace' ) ).resolves.toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
