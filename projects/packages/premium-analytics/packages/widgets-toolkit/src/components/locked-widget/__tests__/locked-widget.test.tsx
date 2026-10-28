/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData, isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { setMockRouteSearch } from '../../../../../../tests/js/route-test-utils';
import { LockedPage, LockedWidget } from '../locked-widget';

jest.mock(
	'@automattic/jetpack-script-data',
	() =>
		jest.requireActual( '../../../../../../tests/js/script-data-test-utils' ).mockJetpackScriptData
);
jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);

jest.mock( '@wordpress/route', () => ( {
	Link: jest.requireActual( '../../../../../../tests/js/route-test-utils' ).mockWordPressRoute.Link,
} ) );

const recordEvent = jest.mocked( jetpackAnalytics.tracks.recordEvent );

const UPGRADE_URL = 'https://example.com/upgrade';
const SUPPORT_URL = 'https://jetpack.com/support/jetpack-stats/traffic-dashboard/#devices-stats';
const DESCRIPTION = 'See which <link>devices, browsers and OS</link> your visitors are using.';

describe( 'locked states', () => {
	beforeEach( () => {
		recordEvent.mockClear();
		// The server's URLs below are WordPress.com plan checkouts.
		jest.mocked( isWpcomPlatformSite ).mockReturnValue( true );
		( getScriptData as jest.Mock ).mockReturnValue( {
			premium_analytics: {
				plan_gates: {
					tier: 'paid',
					locked_features: {
						devices: {
							description: DESCRIPTION,
							support_url: SUPPORT_URL,
							upgrade_url: UPGRADE_URL,
						},
						utm: { description: DESCRIPTION, support_url: SUPPORT_URL, upgrade_url: '' },
					},
					locked_widget_types: {},
				},
			},
		} );
	} );

	it.each( [
		[ 'widget', <LockedWidget key="widget" feature="devices" /> ],
		[ 'page', <LockedPage key="page" feature="devices" /> ],
	] )( 'shows the %s copy with its support link and the upgrade button', ( _, element ) => {
		render( element );

		expect( screen.getByRole( 'link', { name: /devices, browsers and OS/ } ) ).toHaveAttribute(
			'href',
			SUPPORT_URL
		);
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			UPGRADE_URL
		);
	} );

	it( 'sends a Jetpack site to the dashboard upgrade page, without reloading', () => {
		jest.mocked( isWpcomPlatformSite ).mockReturnValue( false );

		render( <LockedWidget feature="utm" /> );

		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toHaveAttribute(
			'href',
			'/upgrade?source=jetpack-premium-analytics-locked-feature'
		);
	} );

	it( 'carries the report window and tab, so the upgrade page returns to them', () => {
		jest.mocked( isWpcomPlatformSite ).mockReturnValue( false );
		setMockRouteSearch( {
			from: '2026-01-01',
			to: '2026-01-31',
			ds: 'insights',
			post_id: undefined,
		} );

		render( <LockedWidget feature="utm" /> );

		const href = new URL(
			screen.getByRole( 'link', { name: 'Upgrade' } ).getAttribute( 'href' ) ?? '',
			'https://example.com'
		);
		expect( Object.fromEntries( href.searchParams ) ).toEqual( {
			from: '2026-01-01',
			to: '2026-01-31',
			ds: 'insights',
			source: 'jetpack-premium-analytics-locked-feature',
		} );
		setMockRouteSearch();
	} );

	it( 'drops the button when there is nowhere to buy', () => {
		render( <LockedWidget feature="utm" /> );

		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );

	it( 'records which feature the upgrade was for', async () => {
		render( <LockedWidget feature="devices" /> );
		// jsdom cannot follow the link.
		document.addEventListener( 'click', event => event.preventDefault(), { once: true } );

		await userEvent.click( screen.getByRole( 'link', { name: 'Upgrade' } ) );

		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_plan_upgrade_click', {
			feature: 'devices',
			source: 'locked_widget',
		} );
	} );
} );
